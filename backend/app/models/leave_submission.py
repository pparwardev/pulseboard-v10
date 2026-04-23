from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.sql import func
from app.core.database import Base


class LeaveSubmission(Base):
    __tablename__ = "leave_submissions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_date = Column(Date, nullable=False)
    leave_type = Column(String(50), nullable=True)
    reason = Column(String(500), nullable=True)
    is_delivered = Column(Boolean, default=False)
    is_viewed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
