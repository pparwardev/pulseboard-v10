"""User Preferences API — shift & week-off."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/user-preferences", tags=["User Preferences"])


class ShiftWeekOffUpdate(BaseModel):
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    week_off: Optional[str] = None


@router.put("/shift-weekoff")
def update_shift_weekoff(data: ShiftWeekOffUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.shift_start is not None:
        current_user.shift_start = data.shift_start
    if data.shift_end is not None:
        current_user.shift_end = data.shift_end
    if data.week_off is not None:
        current_user.week_off = data.week_off
    db.commit()
    return {"status": "ok"}
