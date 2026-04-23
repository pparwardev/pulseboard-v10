"""Wall of Fame API."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.wall_of_fame import WallPost, WallReaction, WallComment
from app.api.profile import photo_url

router = APIRouter(prefix="/api/wall", tags=["Wall of Fame"])
REACTION_EMOJIS = ["👍", "❤️", "🎉", "🔥", "👏", "😂"]


def _get_team_user_ids(db, current_user):
    if current_user.role == 'manager':
        manager_login = current_user.login
    else:
        manager_login = current_user.manager_login
    if not manager_login:
        return [current_user.id]
    ids = [uid for (uid,) in db.query(User.id).filter(User.manager_login == manager_login, User.is_active == True).all()]
    mgr = db.query(User).filter(User.login == manager_login, User.is_active == True).first()
    if mgr and mgr.id not in ids:
        ids.append(mgr.id)
    if current_user.id not in ids:
        ids.append(current_user.id)
    return ids


def _build_post_response(post, db, current_user_id):
    user_reaction = db.query(WallReaction).filter(WallReaction.post_id == post.id, WallReaction.user_id == current_user_id).first()
    reaction_counts = {}
    for emoji in REACTION_EMOJIS:
        count = db.query(WallReaction).filter(WallReaction.post_id == post.id, WallReaction.reaction == emoji).count()
        if count > 0:
            reaction_counts[emoji] = count
    comments = [{"id": c.id, "user_name": c.user.name, "user_photo": photo_url(c.user), "content": c.content, "created_at": c.created_at.isoformat()}
                for c in db.query(WallComment).filter(WallComment.post_id == post.id).order_by(WallComment.created_at.asc()).all()]
    recipient_names = []
    if post.recipient_ids:
        ids = [int(x) for x in post.recipient_ids.split(",") if x]
        users = db.query(User).filter(User.id.in_(ids)).all()
        recipient_names = [{"id": u.id, "name": u.name, "photo": photo_url(u)} for u in users]
    return {
        "id": post.id, "user_id": post.user_id, "user_name": post.user.name, "user_photo": photo_url(post.user),
        "user_role": post.user.role, "post_type": post.post_type, "content": post.content, "emoji": post.emoji,
        "gif_url": post.gif_url, "image_url": post.image_url, "badge": post.badge,
        "recipient_ids": [int(x) for x in post.recipient_ids.split(",") if x] if post.recipient_ids else [],
        "recipient_names": recipient_names,
        "leadership_principles": [x for x in post.leadership_principles.split(",") if x] if post.leadership_principles else [],
        "is_pinned": post.is_pinned, "created_at": post.created_at.isoformat(),
        "reaction_counts": reaction_counts, "total_reactions": sum(reaction_counts.values()),
        "user_reaction": user_reaction.reaction if user_reaction else None,
        "comments": comments, "comment_count": len(comments),
    }


class PostCreate(BaseModel):
    content: str
    emoji: Optional[str] = None
    gif_url: Optional[str] = None
    badge: Optional[str] = None
    recipient_ids: Optional[List[int]] = None
    leadership_principles: Optional[List[str]] = None
    post_type: Optional[str] = "user"
    image_url: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

class ReactionCreate(BaseModel):
    reaction: str = "👍"


@router.get("/team-members")
def search_team_members(q: str = "", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team_ids = _get_team_user_ids(db, current_user)
    query = db.query(User).filter(User.is_active == True, User.id != current_user.id, User.id.in_(team_ids))
    if q:
        query = query.filter(User.name.ilike(f"%{q}%"))
    return [{"id": u.id, "name": u.name, "photo": photo_url(u), "login": u.login} for u in query.order_by(User.name).limit(20).all()]


@router.get("/posts")
def get_wall_posts(page: int = 1, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team_ids = _get_team_user_ids(db, current_user)
    limit, offset = 20, (page - 1) * 20
    posts = db.query(WallPost).filter(WallPost.user_id.in_(team_ids)).order_by(WallPost.is_pinned.desc(), WallPost.created_at.desc()).offset(offset).limit(limit).all()
    total = db.query(WallPost).filter(WallPost.user_id.in_(team_ids)).count()
    return {"posts": [_build_post_response(p, db, current_user.id) for p in posts], "total": total, "page": page, "has_more": offset + limit < total}


@router.post("/posts")
def create_post(data: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not data.content.strip():
        raise HTTPException(400, "Post content cannot be empty")
    post = WallPost(
        user_id=current_user.id, post_type=data.post_type or "user", content=data.content.strip(),
        emoji=data.emoji, gif_url=data.gif_url, image_url=data.image_url, badge=data.badge,
        recipient_ids=",".join(str(i) for i in data.recipient_ids) if data.recipient_ids else None,
        leadership_principles=",".join(data.leadership_principles) if data.leadership_principles else None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _build_post_response(post, db, current_user.id)


@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(WallPost).filter(WallPost.id == post_id).first()
    if not post: raise HTTPException(404, "Post not found")
    if post.user_id != current_user.id and current_user.role != "manager":
        raise HTTPException(403, "Not authorized")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}


@router.post("/posts/{post_id}/react")
def react_to_post(post_id: int, data: ReactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.reaction not in REACTION_EMOJIS:
        raise HTTPException(400, "Invalid reaction")
    existing = db.query(WallReaction).filter(WallReaction.post_id == post_id, WallReaction.user_id == current_user.id).first()
    if existing:
        if existing.reaction == data.reaction:
            db.delete(existing)
        else:
            existing.reaction = data.reaction
    else:
        db.add(WallReaction(post_id=post_id, user_id=current_user.id, reaction=data.reaction))
    db.commit()
    return {"message": "Reaction updated"}


@router.post("/posts/{post_id}/comment")
def add_comment(post_id: int, data: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not data.content.strip():
        raise HTTPException(400, "Comment cannot be empty")
    db.add(WallComment(post_id=post_id, user_id=current_user.id, content=data.content.strip()))
    db.commit()
    return {"message": "Comment added"}


@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = db.query(WallComment).filter(WallComment.id == comment_id).first()
    if not comment: raise HTTPException(404, "Comment not found")
    if comment.user_id != current_user.id and current_user.role != "manager":
        raise HTTPException(403, "Not authorized")
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}
