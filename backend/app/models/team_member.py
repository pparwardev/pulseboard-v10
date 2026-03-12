from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String(100), default="Specialist")
    join_date = Column(Date, nullable=True)
    shift_start = Column(Time, nullable=True)
    shift_end = Column(Time, nullable=True)
    photo_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    level = Column(String(10), nullable=True)
    country = Column(String(100), nullable=True)
    country_code = Column(String(10), nullable=True)
    supports_marketplace = Column(String(50), nullable=True)
    skillset = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="team_member")
