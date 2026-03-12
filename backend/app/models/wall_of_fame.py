from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class WallPost(Base):
    __tablename__ = "wall_posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_type = Column(String(50), default="user")
    content = Column(Text, nullable=False)
    emoji = Column(String(10), nullable=True)
    gif_url = Column(String(500), nullable=True)
    badge = Column(String(50), nullable=True)
    recipient_ids = Column(String(500), nullable=True)
    leadership_principles = Column(String(500), nullable=True)
    week_number = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
    image_url = Column(Text, nullable=True)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")
    reactions = relationship("WallReaction", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("WallComment", back_populates="post", cascade="all, delete-orphan")


class WallReaction(Base):
    __tablename__ = "wall_reactions"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("wall_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reaction = Column(String(10), default="👍")
    created_at = Column(DateTime, default=datetime.utcnow)
    post = relationship("WallPost", back_populates="reactions")
    user = relationship("User")


class WallComment(Base):
    __tablename__ = "wall_comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("wall_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    post = relationship("WallPost", back_populates="comments")
    user = relationship("User")
