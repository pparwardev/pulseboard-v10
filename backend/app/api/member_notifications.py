"""Member Dashboard Notification Tiles API for PulseBoard V10."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta, date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/dashboard/v2/member-notifications", tags=["Member Notifications"])


def _photo(user):
    return user.profile_picture if user else None


def _get_team_ids(db, user):
    team_name = user.team_name
    if not team_name:
        return [user.id]
    # Manager: find members whose manager_login is this user's login
    # Member: find members who share the same manager_login
    if user.role == 'manager':
        lookup_login = user.login
    else:
        lookup_login = user.manager_login
    if not lookup_login:
        return [user.id]
    ids = [uid for (uid,) in db.query(User.id).filter(
        User.team_name == team_name, User.manager_login == lookup_login, User.is_active == True
    ).all()]
    mgr = db.query(User).filter(User.login == lookup_login, User.is_active == True).first()
    if mgr and mgr.id not in ids:
        ids.append(mgr.id)
    if user.id not in ids:
        ids.append(user.id)
    return ids


def _tile(key, title, emoji, gradient, border, nav, items, members):
    return {"key": key, "title": title, "emoji": emoji, "gradient": gradient, "borderColor": border,
            "items": items, "members": members, "count": len(items), "nav": nav}


@router.get("")
def get_member_notification_tiles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    manager = None
    if current_user.manager_login:
        manager = db.query(User).filter(User.login == current_user.manager_login, User.is_active == True).first()

    team_ids = _get_team_ids(db, current_user)

    is_manager = current_user.role == 'manager'

    tiles = [
        _tile("weekly_scores", "Weekly Scores", "📈", "from-blue-500 via-blue-600 to-indigo-600", "border-blue-300", "/my-performance",
              *_weekly_scores(db, current_user)),
        _tile("polls", "Poll Updates", "📊", "from-violet-500 via-purple-500 to-fuchsia-500", "border-violet-300", "/polls",
              *_polls(db, current_user, team_ids)),
        _tile("ot_submitted", "OT Submitted", "⏰", "from-orange-500 via-amber-500 to-yellow-500", "border-orange-300", "/team-updates" if is_manager else "/ot",
              *_ot_submitted(db, current_user, team_ids, manager, is_manager)),
        _tile("leave_calendar", "Leave Calendar", "🏖️", "from-teal-500 via-emerald-500 to-green-500", "border-teal-300", "/leave-calendar",
              *_leave_calendar(db, current_user, team_ids, manager, is_manager)),
        _tile("wall_of_fame", "Wall of Fame", "🏆", "from-yellow-500 via-amber-500 to-orange-400", "border-yellow-300", "/wall-of-fame",
              *_wall_of_fame(db, current_user, team_ids)),
        _tile("ot_champion", "OT Champion of the Month", "🥇", "from-rose-500 via-pink-500 to-fuchsia-500", "border-rose-300", "/team-updates" if is_manager else "/ot",
              *_ot_champion(db, current_user, team_ids)),
    ]
    return {"tiles": tiles}


def _ot_champion(db, current_user, team_ids):
    """OT Champion of the Month — last month's OT leaderboard, descending by total hours."""
    from app.models.ot_submission import OTSubmission

    items, members_set = [], {}
    today = date.today()
    first_of_this_month = today.replace(day=1)
    last_month_end = first_of_this_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    month_name = last_month_end.strftime("%B %Y")

    # Get total OT hours per team member for last month
    results = db.query(
        OTSubmission.user_id, func.sum(OTSubmission.hours).label("total_hours")
    ).filter(
        OTSubmission.user_id.in_(team_ids),
        OTSubmission.date >= last_month_start,
        OTSubmission.date <= last_month_end,
    ).group_by(OTSubmission.user_id).order_by(desc("total_hours")).all()

    for rank, (uid, total) in enumerate(results, 1):
        u = db.query(User).filter(User.id == uid).first()
        if not u:
            continue
        u_name = u.name
        members_set[u.id] = {"id": u.id, "name": u_name, "photo": _photo(u)}
        medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"#{rank}"
        ot_nav = "/team-updates" if current_user.role == 'manager' else "/ot"
        items.append({
            "text": f"{medal} <b>{u_name}</b> — <b>{round(total, 1)} hrs</b> OT in {month_name}",
            "time": None, "type": "ot_champion", "nav": ot_nav,
            "member_name": u_name, "member_photo": _photo(u),
        })

    return items, list(members_set.values())


def _weekly_scores(db, current_user):
    from app.models.file_upload import FileUpload
    from app.models.member_performance_metric import MemberPerformanceMetric
    from app.models.team_member import TeamMember

    items, members_set = [], {}
    cu_name, cu_photo = current_user.name, _photo(current_user)
    members_set[current_user.id] = {"id": current_user.id, "name": cu_name, "photo": cu_photo}

    recent = db.query(FileUpload).filter(
        FileUpload.uploaded_at >= datetime.utcnow() - timedelta(days=14)
    ).order_by(desc(FileUpload.uploaded_at)).limit(5).all()

    seen = set()
    for f in recent:
        key = f"{f.metric_code}_{f.week_label}"
        if key in seen:
            continue
        seen.add(key)
        uploader = f.user if hasattr(f, 'user') and f.user else None
        u_name = uploader.name if uploader else "Manager"
        u_photo = _photo(uploader) if uploader else None
        items.append({
            "text": f"<b>{f.metric_code or 'Data'}</b> updated for <b>{f.week_label or ''}</b>",
            "time": f.uploaded_at.isoformat() if f.uploaded_at else None,
            "type": "upload", "nav": "/my-performance",
            "member_name": u_name, "member_photo": u_photo,
        })

    tm = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
    if tm:
        latest = db.query(
            MemberPerformanceMetric.metric_code, MemberPerformanceMetric.week_number, MemberPerformanceMetric.normalized_score
        ).filter(MemberPerformanceMetric.member_id == tm.id).order_by(
            MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()
        ).limit(5).all()

        seen2 = set()
        for code, wk, score in latest:
            k = f"{code}_W{wk}"
            if k in seen2:
                continue
            seen2.add(k)
            items.append({
                "text": f"Your <b>{code}</b> score for Week {wk}: <b>{round(score, 1)}%</b>",
                "time": None, "type": "published", "nav": f"/my-performance",
                "member_name": cu_name, "member_photo": cu_photo,
            })

    return items[:8], list(members_set.values())


def _polls(db, current_user, team_ids):
    from app.models.poll import Poll, PollVote

    items, members_set = [], {}
    active = db.query(Poll).filter(Poll.created_by.in_(team_ids), Poll.is_active == True).order_by(desc(Poll.created_at)).limit(5).all()

    for p in active:
        voted = db.query(PollVote).filter(PollVote.poll_id == p.id, PollVote.user_id == current_user.id).first()
        label = "Vote now!" if not voted else "Voted ✓"
        creator = db.query(User).filter(User.id == p.created_by).first()
        c_name = creator.name if creator else "Someone"
        c_photo = _photo(creator)
        if creator:
            members_set[creator.id] = {"id": creator.id, "name": c_name, "photo": c_photo}
        items.append({
            "text": f"📊 <b>{p.question}</b> — {label}",
            "time": p.created_at.isoformat() if p.created_at else None,
            "type": "created", "nav": "/polls",
            "member_name": c_name, "member_photo": c_photo,
        })

    closed = db.query(Poll).filter(Poll.created_by.in_(team_ids), Poll.is_active == False).order_by(desc(Poll.created_at)).limit(3).all()
    for p in closed:
        creator = db.query(User).filter(User.id == p.created_by).first()
        c_name = creator.name if creator else "Someone"
        c_photo = _photo(creator)
        if creator:
            members_set[creator.id] = {"id": creator.id, "name": c_name, "photo": c_photo}
        items.append({
            "text": f"<b>{p.question}</b> is closed",
            "time": p.created_at.isoformat() if p.created_at else None,
            "type": "closed", "nav": "/polls",
            "member_name": c_name, "member_photo": c_photo,
        })

    return items, list(members_set.values())


def _ot_submitted(db, current_user, team_ids, manager, is_manager):
    """OT Submitted tile: Manager sees all team members' OT, Member sees only own OT."""
    from app.models.ot_submission import OTSubmission

    items, members_set = [], {}
    today = date.today()
    month_start = today.replace(day=1)

    if is_manager:
        specialist_ids = [uid for (uid,) in db.query(User.id).filter(
            User.id.in_(team_ids), User.role == 'specialist', User.is_active == True
        ).all()]
        ot_subs = db.query(OTSubmission).filter(
            OTSubmission.user_id.in_(specialist_ids), OTSubmission.date >= month_start
        ).order_by(desc(OTSubmission.created_at)).limit(15).all()

        for o in ot_subs:
            u = db.query(User).filter(User.id == o.user_id).first()
            u_name = u.name if u else "Team member"
            if u:
                members_set[u.id] = {"id": u.id, "name": u_name, "photo": _photo(u)}
            month_name = o.date.strftime("%B") if o.date else "—"
            items.append({
                "text": f"⏰ <b>{u_name}</b> submitted OT for <b>{month_name}</b>",
                "time": o.created_at.isoformat() if o.created_at else None,
                "type": "ot", "nav": "/team-updates",
                "member_name": u_name, "member_photo": _photo(u) if u else None,
            })
    else:
        ot_subs = db.query(OTSubmission).filter(
            OTSubmission.user_id == current_user.id, OTSubmission.date >= month_start
        ).order_by(desc(OTSubmission.created_at)).limit(10).all()

        members_set[current_user.id] = {"id": current_user.id, "name": current_user.name, "photo": _photo(current_user)}
        for o in ot_subs:
            month_name = o.date.strftime("%B") if o.date else "—"
            items.append({
                "text": f"⏰ <b>{month_name}</b> OT submitted successfully to Manager",
                "time": o.created_at.isoformat() if o.created_at else None,
                "type": "ot", "nav": "/ot",
                "member_name": current_user.name, "member_photo": _photo(current_user),
            })

    items.sort(key=lambda x: x["time"] or "", reverse=True)
    return items[:8], list(members_set.values())


def _leave_calendar(db, current_user, team_ids, manager, is_manager):
    """Leave Calendar tile: Both Manager and Member see all team leaves from today onwards."""
    from app.models.upcoming_leave import UpcomingLeave

    items, members_set = [], {}
    today = date.today()

    # All upcoming leaves from today onwards (including ongoing ones)
    from sqlalchemy import or_, case
    leaves = db.query(UpcomingLeave).join(User, UpcomingLeave.user_id == User.id).filter(
        UpcomingLeave.user_id.in_(team_ids),
        or_(
            UpcomingLeave.leave_date >= today,
            UpcomingLeave.end_date >= today,
        )
    ).order_by(UpcomingLeave.leave_date).all()

    for ul in leaves:
        u = db.query(User).filter(User.id == ul.user_id).first()
        u_name = u.name if u else "Team member"
        if u:
            members_set[u.id] = {"id": u.id, "name": u_name, "photo": _photo(u)}
        start_str = ul.leave_date.strftime("%d %b") if ul.leave_date else "—"
        is_today = ul.leave_date <= today and (ul.end_date is None or ul.end_date >= today)
        if ul.end_date and ul.end_date != ul.leave_date:
            num_days = (ul.end_date - ul.leave_date).days + 1
            end_str = ul.end_date.strftime("%d %b")
            date_text = f"from <b>{start_str}</b> to <b>{end_str}</b> for <b>{num_days} days</b>"
        else:
            date_text = f"on <b>{start_str}</b>"
        if is_today:
            items.append({
                "text": f"🔴 <b>{u_name}</b> is OTTO today",
                "time": ul.created_at.isoformat() if ul.created_at else None,
                "type": "otto_today", "nav": "/leave-calendar",
                "member_name": u_name, "member_photo": _photo(u) if u else None,
            })
        else:
            items.append({
                "text": f"🏖️ <b>{u_name}</b> will be OTTO {date_text}",
                "time": ul.created_at.isoformat() if ul.created_at else None,
                "type": "upcoming_leave", "nav": "/leave-calendar",
                "member_name": u_name, "member_photo": _photo(u) if u else None,
            })

    return items[:15], list(members_set.values())


def _wall_of_fame(db, current_user, team_ids):
    from app.models.wall_of_fame import WallPost

    items, members_set = [], {}
    today = date.today()

    recent_posts = db.query(WallPost).filter(
        WallPost.post_type.in_(["top_performer", "shoutout"]),
        WallPost.created_at >= datetime.utcnow() - timedelta(days=14)
    ).order_by(desc(WallPost.created_at)).limit(5).all()

    for p in recent_posts:
        u = db.query(User).filter(User.id == p.user_id).first()
        if u:
            members_set[u.id] = {"id": u.id, "name": u.name, "photo": _photo(u)}
        wk = f"Week {p.week_number}" if p.week_number else ""
        items.append({
            "text": f"🏆 <b>{u.name if u else 'Member'}</b> won champion of {wk}" if p.post_type == "top_performer" else (p.content[:100] if p.content else "🌟 Shoutout!"),
            "time": p.created_at.isoformat() if p.created_at else None,
            "type": "champion", "nav": "/wall-of-fame",
            "member_name": u.name if u else None, "member_photo": _photo(u) if u else None,
        })

    # Birthdays today
    today_mmdd = today.strftime('-%m-%d')
    birthday_users = db.query(User).filter(
        User.id.in_(team_ids), User.is_active == True, User.date_of_birth.isnot(None),
        User.date_of_birth.like(f'%{today_mmdd}'),
    ).all()

    for u in birthday_users:
        members_set[u.id] = {"id": u.id, "name": u.name, "photo": _photo(u)}
        items.append({
            "text": f"🎂 It's <b>{u.name}</b>'s Birthday today!",
            "time": datetime.now().isoformat(), "type": "birthday", "nav": "/wall-of-fame",
            "member_name": u.name, "member_photo": _photo(u),
        })

    return items[:8], list(members_set.values())
