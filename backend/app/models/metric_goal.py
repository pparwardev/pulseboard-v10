"""Metric Goal model for v10 - simplified team metric config."""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class MetricGoal(Base):
    __tablename__ = "metric_goals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    metric_name = Column(String(255), nullable=False)
    metric_code = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=True)
    goal_value = Column(Float, nullable=True)
    green_threshold = Column(Float, nullable=True)
    yellow_threshold = Column(Float, nullable=True)
    red_threshold = Column(Float, nullable=True)
    goal_direction = Column(String(50), default="higher_is_better")
    is_higher_better = Column(Boolean, default=True)
    weight = Column(Float, default=25)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
