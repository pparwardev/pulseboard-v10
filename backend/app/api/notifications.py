"""Notifications API."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id.is_(None))
    ).order_by(Notification.created_at.desc()).limit(50).all()


@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(func.count(Notification.id)).filter(
        ((Notification.user_id == current_user.id) | (Notification.user_id.is_(None))),
        Notification.is_read == False
    ).scalar()
    return {"count": count or 0}


@router.get("/unread-by-type")
def get_unread_by_type(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Notification.type, func.count(Notification.id)).filter(
        ((Notification.user_id == current_user.id) | (Notification.user_id.is_(None))),
        Notification.is_read == False
    ).group_by(Notification.type).all()
    return {t: c for t, c in rows}


@router.post("/{notification_id}/read")
def mark_as_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}


@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        ((Notification.user_id == current_user.id) | (Notification.user_id.is_(None))),
        Notification.is_read == False
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "All marked as read"}


class MarkTypeReadRequest(BaseModel):
    types: List[str]

@router.post("/mark-type-read")
def mark_type_read(data: MarkTypeReadRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        ((Notification.user_id == current_user.id) | (Notification.user_id.is_(None))),
        Notification.type.in_(data.types),
        Notification.is_read == False
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "Marked as read"}


@router.post("/cleanup-old")
def cleanup_old_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Clean old notifications from removed apps - Manager only."""
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can cleanup notifications")
    
    # Valid notification types for PulseBoard V10
    VALID_TYPES = {
        'upload', 'published', 'created', 'closed', 'ot', 'leave', 'otto_today',
        'champion', 'birthday', 'announcement', 'message', 'success_story'
    }
    
    # Delete old notification types
    deleted_count = db.query(Notification).filter(
        ~Notification.type.in_(VALID_TYPES)
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"Cleaned up {deleted_count} old notifications",
        "deleted_count": deleted_count
    }


@router.get("/types")
def get_notification_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all notification types in database."""
    types = db.query(Notification.type, func.count(Notification.id)).group_by(Notification.type).all()
    return {"types": [{"type": t, "count": c} for t, c in types]}
