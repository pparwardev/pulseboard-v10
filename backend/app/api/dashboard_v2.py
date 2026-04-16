"""Dashboard V2 API for PulseBoard V10 — Member dashboard endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime, timedelta, timezone, time as dtime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.team_member import TeamMember
from app.models.upcoming_leave import UpcomingLeave
from app.models.member_performance_metric import MemberPerformanceMetric

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/dashboard/v2", tags=["Dashboard V2"])


def get_live_team_strength(db: Session, team_name: str = None):
    today = date.today()
    q = db.query(User).filter(User.is_active == True, User.role == "specialist")
    if team_name:
        q = q.filter(User.team_name == team_name)
    total = q.count()

    lq = db.query(func.count(UpcomingLeave.id)).join(User, UpcomingLeave.user_id == User.id).filter(
        UpcomingLeave.leave_date <= today,
        (UpcomingLeave.end_date.is_(None) | (UpcomingLeave.end_date >= today)),
        UpcomingLeave.is_processed == False
    )
    if team_name:
        lq = lq.filter(User.team_name == team_name)
    on_leave = lq.scalar() or 0
    present = max(0, total - on_leave)
    return {"total_members": total, "present": present, "on_leave": on_leave}


def get_otto_members(db: Session, team_name: str = None):
    today = date.today()
    q = db.query(User.id, User.name, User.employee_id, User.login, UpcomingLeave.leave_type).join(
        UpcomingLeave, UpcomingLeave.user_id == User.id
    ).filter(
        UpcomingLeave.leave_date <= today,
        (UpcomingLeave.end_date.is_(None) | (UpcomingLeave.end_date >= today)),
        UpcomingLeave.is_processed == False,
        User.role == "specialist"
    )
    if team_name:
        q = q.filter(User.team_name == team_name)
    return [{"id": m.id, "name": m.name, "tm_employee_id": m.employee_id, "login": m.login, "leave_type": m.leave_type or "Leave"} for m in q.all()]


@router.get("/online-team")
def get_online_team(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return team members whose shift is currently running (excludes week off)."""
    now_dt = datetime.now(IST)
    now_ist = now_dt.time()
    today_dow = now_dt.weekday()
    dow_map = {6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6}
    today_idx = dow_map[today_dow]
    team_filter = current_user.team_name

    users = db.query(User).filter(
        User.is_active == True, User.role == "specialist",
        User.shift_start.isnot(None), User.shift_end.isnot(None),
    )
    if team_filter:
        users = users.filter(User.team_name == team_filter)

    online = []
    for u in users.all():
        try:
            sh_start = datetime.strptime(u.shift_start.strip(), "%H:%M").time()
            sh_end = datetime.strptime(u.shift_end.strip(), "%H:%M").time()
        except (ValueError, AttributeError):
            continue
        # skip if today is week off
        if u.week_off:
            off_days = [int(d.strip()) for d in u.week_off.split(',') if d.strip().isdigit()]
            if today_idx in off_days:
                continue
        # handle overnight shifts (e.g. 22:00 - 06:00)
        if sh_start <= sh_end:
            is_on = sh_start <= now_ist <= sh_end
        else:
            is_on = now_ist >= sh_start or now_ist <= sh_end
        if is_on:
            online.append({
                "id": u.id, "name": u.name, "employee_id": u.employee_id,
                "profile_picture": u.profile_picture,
                "shift_end": u.shift_end,
            })
    return {"online_members": online, "count": len(online)}


@router.get("/member")
def get_member_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team_strength = get_live_team_strength(db, current_user.team_name)
    otto_members = get_otto_members(db, current_user.team_name)

    # Get member's performance score
    tm = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
    perf_my_score = None
    perf_week_label = None

    if tm:
        # Get team member IDs for finding latest week
        manager_login = current_user.manager_login
        team_user_ids = [u[0] for u in db.query(User.id).filter(
            User.team_name == current_user.team_name,
            User.manager_login == manager_login,
            User.role == "specialist", User.is_active == True
        ).all()] if manager_login else [current_user.id]
        team_member_ids = [m[0] for m in db.query(TeamMember.id).filter(TeamMember.user_id.in_(team_user_ids)).all()]

        latest = db.query(MemberPerformanceMetric.week_number, MemberPerformanceMetric.year).filter(
            MemberPerformanceMetric.member_id.in_(team_member_ids) if team_member_ids else MemberPerformanceMetric.member_id == tm.id
        ).order_by(MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()).first()

        if latest:
            my_avg = db.query(func.avg(MemberPerformanceMetric.normalized_score)).filter(
                MemberPerformanceMetric.member_id == tm.id,
                MemberPerformanceMetric.week_number == latest[0],
                MemberPerformanceMetric.year == latest[1]
            ).scalar()
            perf_my_score = round(my_avg, 1) if my_avg else None
            perf_week_label = f"W{latest[0]}"

    return {
        "user": {
            "name": current_user.name,
            "employee_id": current_user.employee_id,
            "login": current_user.login,
            "role": current_user.role,
            "team": current_user.team_name,
            "profile_picture": current_user.profile_picture,
            "shift_start": current_user.shift_start,
            "shift_end": current_user.shift_end,
            "week_off": current_user.week_off,
        },
        "perf_my_score": perf_my_score,
        "perf_week_label": perf_week_label,
        "team_strength": team_strength,
        "otto_members": otto_members,
    }
