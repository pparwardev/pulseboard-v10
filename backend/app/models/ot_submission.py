from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.sql import func
from app.core.database import Base


class OTSubmission(Base):
    __tablename__ = "ot_submissions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    hours = Column(Float, nullable=False)
    ot_type = Column(String(10), default="OT")
    reason = Column(String(500), nullable=True)
    status = Column(String(20), default="pending")
    rejection_reason = Column(String(500), nullable=True)
    is_delivered = Column(Boolean, default=False)
    is_viewed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
