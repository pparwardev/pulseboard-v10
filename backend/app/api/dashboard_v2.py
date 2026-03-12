"""Dashboard V2 API for PulseBoard V10 — Member dashboard endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.team_member import TeamMember
from app.models.upcoming_leave import UpcomingLeave
from app.models.member_performance_metric import MemberPerformanceMetric

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
    q = db.query(User.id, User.name, User.employee_id, UpcomingLeave.leave_type).join(
        UpcomingLeave, UpcomingLeave.user_id == User.id
    ).filter(
        UpcomingLeave.leave_date <= today,
        (UpcomingLeave.end_date.is_(None) | (UpcomingLeave.end_date >= today)),
        UpcomingLeave.is_processed == False,
        User.role == "specialist"
    )
    if team_name:
        q = q.filter(User.team_name == team_name)
    return [{"id": m.id, "name": m.name, "tm_employee_id": m.employee_id, "leave_type": m.leave_type or "Leave"} for m in q.all()]


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
