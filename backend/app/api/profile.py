"""Profile API."""
from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import date
import base64, time
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User


def photo_url(user) -> str | None:
    """Return cache-busted photo URL for a user, or None."""
    if not user or not user.profile_picture:
        return None
    ts = int(user.updated_at.timestamp()) if user.updated_at else int(time.time())
    return f"/api/profile/photo/{user.id}?v={ts}"

router = APIRouter(prefix="/api/profile", tags=["profile"])


def calc_tenure(doj_str: str) -> str:
    if not doj_str:
        return None
    try:
        doj = date.fromisoformat(doj_str)
    except (ValueError, TypeError):
        return None
    today = date.today()
    years = today.year - doj.year
    months = today.month - doj.month
    days = today.day - doj.day
    if days < 0:
        months -= 1
        prev_month = today.month - 1 or 12
        prev_year = today.year if today.month > 1 else today.year - 1
        from calendar import monthrange
        days += monthrange(prev_year, prev_month)[1]
    if months < 0:
        years -= 1
        months += 12
    parts = []
    if years > 0:
        parts.append(f"{years} year{'s' if years != 1 else ''}")
    if months > 0:
        parts.append(f"{months} month{'s' if months != 1 else ''}")
    if days > 0:
        parts.append(f"{days} day{'s' if days != 1 else ''}")
    return ', '.join(parts) if parts else '0 days'


@router.get("")
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fields = ["marketplace", "contact_number", "date_of_birth", "location", "profile_picture", "shift_start", "shift_end", "week_off"]
    filled = sum(1 for f in fields if getattr(current_user, f, None) not in (None, "") and str(getattr(current_user, f, "")).strip() != "")
    completion = round((filled / len(fields)) * 100) if fields else 100
    p_url = photo_url(current_user)
    return {
        "id": current_user.id, "login": current_user.login, "email": current_user.email,
        "name": current_user.name, "role": current_user.role, "employee_id": current_user.employee_id,
        "marketplace": current_user.marketplace, "contact_number": current_user.contact_number,
        "team_name": current_user.team_name, "manager_login": current_user.manager_login,
        "shift_start": current_user.shift_start, "shift_end": current_user.shift_end,
        "week_off": current_user.week_off, "date_of_birth": current_user.date_of_birth,
        "location": current_user.location, "skill_set": current_user.skill_set,
        "supports_marketplace": current_user.supports_marketplace,
        "profile_picture": p_url,
        "profilePhoto": {"url": p_url} if p_url else None,
        "profileCompletion": completion,
        "created_at": str(current_user.created_at).split(" ")[0] if current_user.created_at else None,
        "date_of_joining": current_user.date_of_joining,
        "total_tenure": calc_tenure(current_user.date_of_joining),
    }


@router.put("")
def update_profile(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    allowed = ["name", "contact_number", "shift_start", "shift_end", "week_off", "date_of_birth", "date_of_joining", "location", "skill_set", "marketplace", "supports_marketplace"]
    for key in allowed:
        if key in data:
            setattr(current_user, key, data[key])
    db.commit()
    return {"message": "Profile updated"}


@router.post("/photo")
async def upload_photo(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = await file.read()
    if len(content) == 0:
        return {"error": "Empty file"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")
    b64 = f"data:{mime};base64,{base64.b64encode(content).decode()}"
    current_user.profile_picture = b64
    from app.models.team_member import TeamMember
    tm = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
    if tm:
        tm.photo_url = b64
    db.commit()
    db.refresh(current_user)
    return {"url": photo_url(current_user), "size": len(content)}


@router.delete("/photo")
def delete_photo(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.profile_picture = None
    from app.models.team_member import TeamMember
    tm = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
    if tm:
        tm.photo_url = None
    db.commit()
    db.refresh(current_user)
    return {"message": "Photo removed", "profile_picture": None, "profilePhoto": None}


@router.post("/photo-base64")
def upload_photo_base64(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    raw = data.get("data", "")
    ext = data.get("ext", "jpg")
    if not raw:
        return {"error": "No data"}
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")
    b64 = f"data:{mime};base64,{raw}"
    current_user.profile_picture = b64
    from app.models.team_member import TeamMember
    tm = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
    if tm:
        tm.photo_url = b64
    db.commit()
    return {"url": f"/api/profile/photo/{current_user.id}"}


@router.get("/photo/{user_id}")
def get_photo(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.profile_picture:
        return Response(status_code=404)
    pic = user.profile_picture
    if pic.startswith("data:"):
        header, data = pic.split(",", 1)
        mime = header.split(":")[1].split(";")[0]
        return Response(content=base64.b64decode(data), media_type=mime, headers={"Cache-Control": "no-cache"})
    return Response(status_code=404)
