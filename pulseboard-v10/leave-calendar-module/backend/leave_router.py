"""
Leave Calendar Module - FastAPI Router
Embeddable router with all leave CRUD + announce/cancel endpoints.

Usage:
    from leave_router import create_leave_router

    router = create_leave_router(
        get_db=get_db,
        get_current_user=get_current_user,
        get_team_ids=lambda db, user: [u.id for u in db.query(User).filter(User.team_name == user.team_name).all()],
        create_notification=my_notify_fn,  # optional
        User=User,
    )
    app.include_router(router, prefix="/api/leave-calendar")
"""
from datetime import date
from typing import Callable, Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .leave_model import UpcomingLeave


class LeavePayload(BaseModel):
    leave_date: str
    end_date: Optional[str] = None
    leave_type: Optional[str] = "other"
    reason: Optional[str] = None


def create_leave_router(
    get_db: Callable,
    get_current_user: Callable,
    get_team_ids: Callable,  # (db: Session, user) -> List[int]
    User,                    # Your User SQLAlchemy model
    create_notification: Optional[Callable] = None,  # (db, user_id, title, message, notification_type)
) -> APIRouter:
    router = APIRouter(tags=["Leave Calendar"])

    @router.get("/my-leaves")
    def get_my_leaves(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        leaves = db.query(UpcomingLeave).filter(
            UpcomingLeave.user_id == current_user.id
        ).order_by(UpcomingLeave.leave_date.desc()).all()
        return [
            {"id": l.id, "leave_date": l.leave_date.isoformat(),
             "end_date": l.end_date.isoformat() if l.end_date else None,
             "leave_type": l.leave_type, "reason": l.reason, "is_announced": l.is_announced}
            for l in leaves
        ]

    @router.post("/my-leaves")
    def create_leave(data: LeavePayload, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        start = date.fromisoformat(data.leave_date)
        end = date.fromisoformat(data.end_date) if data.end_date else start
        # Check overlap
        for ex in db.query(UpcomingLeave).filter(UpcomingLeave.user_id == current_user.id).all():
            ex_end = ex.end_date or ex.leave_date
            if ex.leave_date <= end and ex_end >= start:
                raise HTTPException(400, "You already have leave for one or more of these dates")
        leave = UpcomingLeave(user_id=current_user.id, leave_date=start, end_date=end,
                              leave_type=data.leave_type, reason=data.reason)
        db.add(leave)
        db.commit()
        db.refresh(leave)
        return {"id": leave.id, "message": "Leave added"}

    @router.put("/my-leaves/{leave_id}")
    def update_leave(leave_id: int, data: LeavePayload, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        leave = db.query(UpcomingLeave).filter(
            UpcomingLeave.id == leave_id, UpcomingLeave.user_id == current_user.id
        ).first()
        if not leave:
            raise HTTPException(404, "Not found")
        leave.leave_date = data.leave_date
        leave.end_date = data.end_date
        leave.leave_type = data.leave_type
        leave.reason = data.reason
        db.commit()
        return {"message": "Updated"}

    @router.delete("/my-leaves/{leave_id}")
    def delete_leave(leave_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        leave = db.query(UpcomingLeave).filter(
            UpcomingLeave.id == leave_id, UpcomingLeave.user_id == current_user.id
        ).first()
        if not leave:
            raise HTTPException(404, "Not found")
        db.delete(leave)
        db.commit()
        return {"message": "Deleted"}

    @router.post("/my-leaves/{leave_id}/announce")
    def announce_leave(leave_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        leave = db.query(UpcomingLeave).filter(
            UpcomingLeave.id == leave_id, UpcomingLeave.user_id == current_user.id
        ).first()
        if not leave:
            raise HTTPException(404, "Not found")
        leave.is_announced = True
        db.commit()
        if create_notification:
            date_str = leave.leave_date.strftime('%d %b %Y')
            end_str = f" to {leave.end_date.strftime('%d %b %Y')}" if leave.end_date and leave.end_date != leave.leave_date else ""
            msg = f"{current_user.name} has announced {leave.leave_type} leave on {date_str}{end_str}"
            manager = db.query(User).filter(User.team_name == current_user.team_name, User.role == 'manager').first()
            if manager:
                create_notification(db=db, user_id=manager.id, title='Leave Announced', message=msg, notification_type='leave_announced')
            for tid in get_team_ids(db, current_user):
                if tid != current_user.id and (not manager or tid != manager.id):
                    create_notification(db=db, user_id=tid, title='Team Leave Update', message=msg, notification_type='leave_announced')
        return {"message": "Leave announced to team & manager"}

    @router.post("/my-leaves/{leave_id}/cancel")
    def cancel_leave(leave_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        leave = db.query(UpcomingLeave).filter(
            UpcomingLeave.id == leave_id, UpcomingLeave.user_id == current_user.id
        ).first()
        if not leave:
            raise HTTPException(404, "Not found")
        if create_notification:
            date_str = leave.leave_date.strftime('%d %b %Y')
            end_str = f" to {leave.end_date.strftime('%d %b %Y')}" if leave.end_date and leave.end_date != leave.leave_date else ""
            msg = f"{current_user.name} has cancelled {leave.leave_type} leave on {date_str}{end_str}"
            manager = db.query(User).filter(User.team_name == current_user.team_name, User.role == 'manager').first()
            if manager:
                create_notification(db=db, user_id=manager.id, title='Leave Cancelled', message=msg, notification_type='leave_cancelled')
            for tid in get_team_ids(db, current_user):
                if tid != current_user.id and (not manager or tid != manager.id):
                    create_notification(db=db, user_id=tid, title='Leave Cancelled', message=msg, notification_type='leave_cancelled')
        db.delete(leave)
        db.commit()
        return {"message": "Leave cancelled and team notified"}

    @router.get("/team-leaves")
    def get_team_leaves(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        team_ids = get_team_ids(db, current_user)
        leaves = db.query(UpcomingLeave).filter(
            UpcomingLeave.user_id.in_(team_ids), UpcomingLeave.is_announced == True
        ).order_by(UpcomingLeave.leave_date.desc()).all()
        result = []
        for l in leaves:
            user = db.query(User).filter(User.id == l.user_id).first()
            result.append({
                "id": l.id, "user_id": l.user_id,
                "user_name": user.name if user else "Unknown",
                "employee_id": getattr(user, 'login', None) or getattr(user, 'employee_id', None),
                "profile_picture": getattr(user, 'profile_picture', None),
                "leave_date": l.leave_date.isoformat(),
                "end_date": l.end_date.isoformat() if l.end_date else l.leave_date.isoformat(),
                "leave_type": l.leave_type, "reason": l.reason,
            })
        return result

    return router
