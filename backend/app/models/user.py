from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    login = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    previous_password = Column(String(255), nullable=True)
    employee_id = Column(String(50), unique=True, nullable=False)
    marketplace = Column(String(10), nullable=True)
    contact_number = Column(String(20), nullable=True)
    level = Column(String(10), nullable=True)
    manager_login = Column(String(100), nullable=True)
    team_name = Column(String(100), nullable=True)
    location = Column(String(100), nullable=True)
    supports_marketplace = Column(String(50), nullable=True)
    skill_set = Column(String(100), nullable=True)
    role = Column(String(50), nullable=False, default="specialist")  # manager or specialist only
    profile_picture = Column(String(500), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    shift_start = Column(String(10), nullable=True)
    shift_end = Column(String(10), nullable=True)
    week_off = Column(String(20), nullable=True)
    latest_hire_date = Column(Date, nullable=True)
    total_tenure = Column(String(100), nullable=True)
    total_tenure = Column(String(100), nullable=True)
    is_email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    team_member = relationship("TeamMember", foreign_keys="[TeamMember.user_id]", back_populates="user", uselist=False)
    polls = relationship("Poll", back_populates="creator", lazy="dynamic")
    poll_votes = relationship("PollVote", back_populates="user", lazy="dynamic")
