"""
Leave Calendar Module - SQLAlchemy Model
Drop this into your models directory and run migrations.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

# If you already have a Base in your app, import that instead:
#   from your_app.core.database import Base
Base = declarative_base()


class UpcomingLeave(Base):
    __tablename__ = "upcoming_leaves"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    leave_type = Column(String(50), nullable=True)  # sick, annual, casual, other
    reason = Column(String(500), nullable=True)
    is_announced = Column(Boolean, default=False)
    is_processed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
