"""Authentication API routes for PulseBoard V10."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if not user_data.email.lower().endswith('@amazon.com'):
        raise HTTPException(status_code=400, detail="Only @amazon.com email addresses are allowed")
    if user_data.role not in ("manager", "specialist"):
        raise HTTPException(status_code=400, detail="Role must be 'manager' or 'specialist'")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_data.login and db.query(User).filter(User.login == user_data.login).first():
        raise HTTPException(status_code=400, detail="Login already registered")

    user = User(
        login=user_data.login or user_data.email.split('@')[0],
        email=user_data.email,
        name=user_data.name,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        employee_id=user_data.employee_id,
        marketplace=user_data.marketplace,
        contact_number=user_data.contact_number,
        manager_login=user_data.manager_login,
        is_active=True,
        is_approved=True if user_data.role == "manager" else False,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    from app.utils.notification_helper import create_notification
    create_notification(db, "New User Registered", f"{user.name} registered as {user.role}", "user_registered")

    return {"message": "Registration successful. Awaiting approval." if user_data.role == "specialist" else "Registration successful."}


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        user = db.query(User).filter(User.login == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    token = create_access_token(data={"sub": str(user.id)})
    from app.models.team_member import TeamMember
    team_member = db.query(TeamMember).filter(TeamMember.user_id == user.id).first()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "login": user.login,
            "email": user.email,
            "name": user.name,
            "employee_id": user.employee_id,
            "marketplace": user.marketplace,
            "contact_number": user.contact_number,
            "manager_login": user.manager_login,
            "team_name": user.team_name,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "is_email_verified": user.is_email_verified,
            "is_active": user.is_active,
            "is_approved": user.is_approved,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "team_member_id": team_member.id if team_member else None,
        }
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
