"""Registration approvals API for managers."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can view users")
    users = db.query(User).filter(User.manager_login == current_user.login).order_by(User.created_at.desc()).all()
    return [{"id": u.id, "login": u.login, "email": u.email, "name": u.name, "role": u.role,
             "employee_id": u.employee_id, "profile_picture": u.profile_picture, "is_active": u.is_active, "is_approved": u.is_approved,
             "created_at": u.created_at.isoformat() if u.created_at else None,
             "contact_number": u.contact_number, "location": u.location, "marketplace": u.marketplace,
             "supports_marketplace": u.supports_marketplace, "date_of_birth": u.date_of_birth,
             "shift_start": u.shift_start, "shift_end": u.shift_end, "week_off": u.week_off,
             "team_name": u.team_name, "total_tenure": u.total_tenure} for u in users]


@router.put("/users/{user_id}/approve")
def approve_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can approve users")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = True
    user.is_active = True
    db.commit()
    return {"message": f"{user.name} approved"}


@router.put("/users/{user_id}/toggle-active")
def toggle_active(user_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can toggle user status")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = data.get("is_active", not user.is_active)
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}
