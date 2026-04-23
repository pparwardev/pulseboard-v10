"""Dynamic Team Member Performance Metrics model."""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MemberPerformanceMetric(Base):
    __tablename__ = "member_performance_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("team_members.id"), nullable=False, index=True)
    metric_code = Column(String(100), nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    normalized_score = Column(Float, nullable=False)
    week_number = Column(Integer, nullable=True, index=True)
    month_number = Column(Integer, nullable=True, index=True)
    year = Column(Integer, nullable=True, index=True)
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    raw_data = Column(JSON, nullable=True)
    source_file = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    member = relationship("TeamMember")
