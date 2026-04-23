from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from app.core.database import Base


class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    skill_code = Column(String(255), unique=True, nullable=False)
    team_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)


class UserSkill(Base):
    __tablename__ = "user_skills"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)
