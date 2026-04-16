"""Profile API."""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
import os, shutil

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/")
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fields = ["marketplace", "contact_number", "date_of_birth", "location", "profile_picture", "shift_start", "shift_end", "week_off"]
    filled = sum(1 for f in fields if getattr(current_user, f, None) not in (None, ""))
    completion = round((filled / len(fields)) * 100)
    photo = {"url": current_user.profile_picture} if current_user.profile_picture else None
    return {
        "id": current_user.id, "login": current_user.login, "email": current_user.email,
        "name": current_user.name, "role": current_user.role, "employee_id": current_user.employee_id,
        "marketplace": current_user.marketplace, "contact_number": current_user.contact_number,
        "team_name": current_user.team_name, "manager_login": current_user.manager_login,
        "shift_start": current_user.shift_start, "shift_end": current_user.shift_end,
        "week_off": current_user.week_off, "date_of_birth": current_user.date_of_birth,
        "location": current_user.location, "skill_set": current_user.skill_set,
        "supports_marketplace": current_user.supports_marketplace,
        "profile_picture": current_user.profile_picture,
        "profilePhoto": photo, "profileCompletion": completion,
        "created_at": str(current_user.created_at).split(" ")[0] if current_user.created_at else None,
        "total_tenure": current_user.total_tenure,
    }


@router.put("/")
def update_profile(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    allowed = ["name", "contact_number", "shift_start", "shift_end", "week_off", "date_of_birth", "location", "skill_set", "marketplace", "supports_marketplace"]
    for key in allowed:
        if key in data:
            setattr(current_user, key, data[key])
    db.commit()
    return {"message": "Profile updated"}


@router.post("/photo")
async def upload_photo(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    os.makedirs("uploads/profiles", exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"profile_{current_user.id}.{ext}"
    path = f"uploads/profiles/{filename}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    current_user.profile_picture = f"/uploads/profiles/{filename}"
    db.commit()
    return {"url": current_user.profile_picture}
