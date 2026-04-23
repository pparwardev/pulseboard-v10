from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.poll import Poll, PollOption, PollVote
from app.api.profile import photo_url
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/polls", tags=["polls"])

class PollOptionCreate(BaseModel):
    option_text: str

class PollCreate(BaseModel):
    question: str
    options: List[PollOptionCreate]

class PollVoteCreate(BaseModel):
    option_id: int


def _get_team_size(db: Session, poll_creator: User) -> int:
    return db.query(User).filter(User.team_name == poll_creator.team_name, User.is_active == True, User.is_approved == True).count()


def _get_team_user_ids(db: Session, current_user: User):
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


def _build_poll_response(poll, db, current_user):
    user_vote = db.query(PollVote).filter(PollVote.poll_id == poll.id, PollVote.user_id == current_user.id).first()
    options_data = []
    for opt in poll.options:
        votes = db.query(PollVote).filter(PollVote.option_id == opt.id).all()
        voters = [{"id": v.user.id, "name": v.user.name, "profile_picture": photo_url(v.user)} for v in votes]
        options_data.append({"id": opt.id, "option_text": opt.option_text, "vote_count": len(votes), "voters": voters})
    total_votes = db.query(PollVote).filter(PollVote.poll_id == poll.id).count()
    return {
        "id": poll.id, "question": poll.question, "created_by": poll.created_by,
        "creator_name": poll.creator.name, "created_at": poll.created_at.isoformat(),
        "is_active": poll.is_active, "options": options_data, "total_votes": total_votes,
        "team_size": _get_team_size(db, poll.creator),
        "user_voted": user_vote is not None,
        "user_voted_option_id": user_vote.option_id if user_vote else None,
        "is_creator": poll.created_by == current_user.id,
    }


@router.post("/")
def create_poll(poll: PollCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can create polls")
    new_poll = Poll(question=poll.question, created_by=current_user.id)
    db.add(new_poll)
    db.flush()
    for opt in poll.options:
        db.add(PollOption(poll_id=new_poll.id, option_text=opt.option_text))
    db.commit()
    return {"message": "Poll created", "poll_id": new_poll.id}


@router.get("/")
def get_polls(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team_ids = _get_team_user_ids(db, current_user)
    polls = db.query(Poll).filter(Poll.is_active == True, Poll.created_by.in_(team_ids)).order_by(Poll.created_at.desc()).all()
    return [_build_poll_response(p, db, current_user) for p in polls]


@router.get("/completed")
def get_completed_polls(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team_ids = _get_team_user_ids(db, current_user)
    polls = db.query(Poll).filter(Poll.is_active == False, Poll.created_by.in_(team_ids)).order_by(Poll.created_at.desc()).all()
    return [_build_poll_response(p, db, current_user) for p in polls]


@router.post("/{poll_id}/vote")
def vote_poll(poll_id: int, vote: PollVoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll: raise HTTPException(status_code=404, detail="Poll not found")
    if not poll.is_active: raise HTTPException(status_code=400, detail="Poll completed")
    if poll.created_by == current_user.id: raise HTTPException(status_code=403, detail="Cannot vote on own poll")
    option = db.query(PollOption).filter(PollOption.id == vote.option_id, PollOption.poll_id == poll_id).first()
    if not option: raise HTTPException(status_code=400, detail="Invalid option")
    existing = db.query(PollVote).filter(PollVote.poll_id == poll_id, PollVote.user_id == current_user.id).first()
    if existing:
        existing.option_id = vote.option_id
        existing.voted_at = datetime.utcnow()
    else:
        db.add(PollVote(poll_id=poll_id, option_id=vote.option_id, user_id=current_user.id))
    db.commit()
    return {"message": "Vote recorded"}


@router.delete("/{poll_id}")
def delete_poll(poll_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll: raise HTTPException(status_code=404, detail="Poll not found")
    if poll.created_by != current_user.id: raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(poll)
    db.commit()
    return {"message": "Poll deleted"}
