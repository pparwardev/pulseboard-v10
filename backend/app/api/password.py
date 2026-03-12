"""Password management API."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import secrets, hashlib
from app.core.database import get_db
from app.core.security import hash_password, verify_password, get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/password", tags=["password"])
reset_tokens = {}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class PasswordResponse(BaseModel):
    message: str
    success: bool


def validate_password_strength(password: str) -> list:
    errors = []
    if len(password) < 8: errors.append("Password must be at least 8 characters long")
    if not any(c.isupper() for c in password): errors.append("Must contain at least one uppercase letter")
    if not any(c.islower() for c in password): errors.append("Must contain at least one lowercase letter")
    if not any(c.isdigit() for c in password): errors.append("Must contain at least one number")
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password): errors.append("Must contain at least one special character")
    return errors


@router.post("/change", response_model=PasswordResponse)
def change_password(request: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    if request.current_password == request.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")
    errors = validate_password_strength(request.new_password)
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))
    current_user.hashed_password = hash_password(request.new_password)
    db.commit()
    return PasswordResponse(message="Password changed successfully!", success=True)


@router.post("/forgot", response_model=PasswordResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return PasswordResponse(message="If this email is registered, a reset token has been generated.", success=True)
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    reset_tokens[token_hash] = {"user_id": user.id, "email": user.email, "expires_at": datetime.utcnow() + timedelta(minutes=30), "used": False}
    reset_tokens[f"latest_{user.email}"] = {"token": token, "created_at": datetime.utcnow().isoformat()}
    print(f"\n{'='*50}\nPASSWORD RESET TOKEN for {user.email}\nToken: {token}\nExpires in 30 minutes\n{'='*50}\n")
    return PasswordResponse(message="If this email is registered, a reset token has been generated.", success=True)


@router.post("/reset", response_model=PasswordResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    errors = validate_password_strength(request.new_password)
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    token_data = reset_tokens.get(token_hash)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if token_data["used"]:
        raise HTTPException(status_code=400, detail="This reset token has already been used")
    if datetime.utcnow() > token_data["expires_at"]:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    user.hashed_password = hash_password(request.new_password)
    token_data["used"] = True
    db.commit()
    return PasswordResponse(message="Password reset successfully!", success=True)


@router.post("/admin-reset", response_model=PasswordResponse)
def admin_reset_password(request: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can reset passwords")
    user = db.query(User).filter(User.email == request.get("user_email")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(request.get("new_password"))
    db.commit()
    return PasswordResponse(message=f"Password reset for {request.get('user_email')}.", success=True)


@router.get("/reset-token/{email}")
def get_reset_token(email: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can view reset tokens")
    token_data = reset_tokens.get(f"latest_{email}")
    if not token_data:
        raise HTTPException(status_code=404, detail="No reset token found")
    return {"email": email, "token": token_data["token"], "created_at": token_data["created_at"]}
