from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional


class UserRegistration(BaseModel):
    login: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str
    employee_id: str = Field(..., min_length=3)
    marketplace: str
    country_code: str = "+91"
    contact_number: str = Field(..., pattern=r"^\+?[0-9]{10,15}$")
    manager_login: str = Field(..., min_length=3)
    name: str = Field(..., min_length=2)
    role: str = Field(..., pattern="^(manager|specialist)$")

    @validator('email')
    def validate_amazon_email(cls, v):
        if not v.endswith('@amazon.com'):
            raise ValueError('Email must be from amazon.com domain')
        return v

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


class LoginRequest(BaseModel):
    login: str
    password: str


class UserResponse(BaseModel):
    id: int
    login: str
    email: str
    name: str
    employee_id: str
    role: str
    is_email_verified: bool
    is_approved: bool
    marketplace: Optional[str]
    team_name: Optional[str]
    manager_login: Optional[str]

    class Config:
        from_attributes = True
