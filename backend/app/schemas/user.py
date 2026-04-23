from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    login: Optional[str] = None
    email: EmailStr
    name: str
    password: str
    role: str = "specialist"
    employee_id: Optional[str] = None
    marketplace: Optional[str] = None
    contact_number: Optional[str] = None
    manager_login: Optional[str] = None
    team_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    login: Optional[str] = None
    email: str
    name: str
    role: str
    employee_id: Optional[str] = None
    marketplace: Optional[str] = None
    contact_number: Optional[str] = None
    manager_login: Optional[str] = None
    team_name: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool
    is_approved: Optional[bool] = True
    is_email_verified: Optional[bool] = True
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
