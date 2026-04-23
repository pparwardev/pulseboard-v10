"""Skills API - fetch team skills, get/assign user skills."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.skill import Skill, UserSkill

router = APIRouter(prefix="/api/skills", tags=["Skills"])


@router.get("/team/{team_name}")
def get_team_skills(team_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skills = db.query(Skill).filter(Skill.team_name == team_name, Skill.is_active == True).order_by(Skill.skill_code).all()
    if not skills:
        skills = db.query(Skill).filter(Skill.is_active == True).order_by(Skill.skill_code).all()
    return {"skills": [s.skill_code for s in skills]}


@router.get("/all")
def get_all_skills(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skills = db.query(Skill).filter(Skill.is_active == True).order_by(Skill.skill_code).all()
    return {"skills": [s.skill_code for s in skills]}


@router.get("/user/{user_id}")
def get_user_skills(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_skills = db.query(Skill.skill_code).join(UserSkill, UserSkill.skill_id == Skill.id).filter(UserSkill.user_id == user_id).all()
    return {"skills": [s[0] for s in user_skills]}


@router.put("/user/{user_id}")
def assign_user_skills(user_id: int, payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skill_codes: List[str] = payload.get("skills", [])
    db.query(UserSkill).filter(UserSkill.user_id == user_id).delete()
    for code in skill_codes:
        skill = db.query(Skill).filter(Skill.skill_code == code).first()
        if skill:
            db.add(UserSkill(user_id=user_id, skill_id=skill.id))
    db.commit()
    return {"message": "Skills updated", "count": len(skill_codes)}
