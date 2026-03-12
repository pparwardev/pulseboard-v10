"""Published Metric Data API for PulseBoard V10."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.team_member import TeamMember
from app.models.member_performance_metric import MemberPerformanceMetric
from app.models.metric_goal import MetricGoal
from app.api.performance_analytics import get_team_members

router = APIRouter(prefix="/api/published-metrics", tags=["Published Metrics"])


@router.get("/data")
def get_published_metric_data(
    metric_code: str,
    week: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    metric = db.query(MetricGoal).filter(MetricGoal.metric_code == metric_code, MetricGoal.is_active == True).first()
    if not metric:
        metric = db.query(MetricGoal).filter(MetricGoal.metric_name == metric_code, MetricGoal.is_active == True).first()
        if metric:
            metric_code = metric.metric_code
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")

    available_weeks = db.query(
        MemberPerformanceMetric.week_number, MemberPerformanceMetric.year
    ).filter(
        MemberPerformanceMetric.metric_code == metric_code
    ).distinct().order_by(
        MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()
    ).all()
    weeks_list = [{"week": w[0], "year": w[1]} for w in available_weeks]

    if not weeks_list:
        return {
            "metric_name": metric.metric_name, "metric_code": metric_code,
            "unit": metric.unit or "", "goal_value": metric.goal_value,
            "is_higher_better": metric.is_higher_better,
            "available_weeks": [], "selected_week": None, "selected_year": None, "members": []
        }

    sel_year = year or weeks_list[0]["year"]
    sel_week = week or weeks_list[0]["week"]

    filtered_members = get_team_members(db, current_user)
    filtered_member_ids = [m.id for m in filtered_members]

    records = db.query(MemberPerformanceMetric).filter(
        MemberPerformanceMetric.metric_code == metric_code,
        MemberPerformanceMetric.week_number == sel_week,
        MemberPerformanceMetric.year == sel_year,
        MemberPerformanceMetric.member_id.in_(filtered_member_ids)
    ).all()

    member_map = {m.id: m for m in filtered_members}
    user_photo_map = {}
    user_ids = [m.user_id for m in filtered_members if m.user_id]
    if user_ids:
        user_photos = db.query(User.id, User.profile_picture).filter(User.id.in_(user_ids)).all()
        user_photo_map = {u[0]: u[1] for u in user_photos}

    members = []
    for r in records:
        member = member_map.get(r.member_id)
        if not member:
            continue
        photo = member.photo_url or (user_photo_map.get(member.user_id) if member.user_id else None)
        members.append({
            "member_id": r.member_id, "name": member.name,
            "employee_id": member.employee_id or "", "profile_picture": photo,
            "metric_value": round(r.metric_value, 2), "normalized_score": round(r.normalized_score, 2),
            "source_file": r.source_file, "raw_data": r.raw_data or {}
        })

    members.sort(key=lambda x: x["normalized_score"], reverse=True)

    return {
        "metric_name": metric.metric_name, "metric_code": metric_code,
        "unit": metric.unit or "", "goal_value": metric.goal_value,
        "is_higher_better": metric.is_higher_better,
        "available_weeks": weeks_list, "selected_week": sel_week, "selected_year": sel_year,
        "members": members
    }


@router.get("/trend")
def get_published_metric_trend(
    metric_code: str,
    weeks: int = 4,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    metric = db.query(MetricGoal).filter(MetricGoal.metric_code == metric_code, MetricGoal.is_active == True).first()
    if not metric:
        metric = db.query(MetricGoal).filter(MetricGoal.metric_name == metric_code, MetricGoal.is_active == True).first()
        if metric:
            metric_code = metric.metric_code
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")

    available = db.query(
        MemberPerformanceMetric.week_number, MemberPerformanceMetric.year
    ).filter(
        MemberPerformanceMetric.metric_code == metric_code
    ).distinct().order_by(
        MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()
    ).limit(weeks).all()
    available.reverse()

    filtered_members = get_team_members(db, current_user)
    filtered_member_ids = [m.id for m in filtered_members]

    week_data = []
    for wk, yr in available:
        records = db.query(MemberPerformanceMetric).filter(
            MemberPerformanceMetric.metric_code == metric_code,
            MemberPerformanceMetric.week_number == wk,
            MemberPerformanceMetric.year == yr,
            MemberPerformanceMetric.member_id.in_(filtered_member_ids)
        ).all()
        if not records:
            continue
        avg_value = sum(r.metric_value for r in records) / len(records)
        avg_score = sum(r.normalized_score for r in records) / len(records)
        above_goal = 0
        if metric.goal_value:
            above_goal = sum(
                1 for r in records
                if (r.metric_value >= metric.goal_value if metric.is_higher_better else r.metric_value <= metric.goal_value)
            )
        week_data.append({
            "week": wk, "year": yr, "avg_value": round(avg_value, 2),
            "avg_score": round(avg_score, 2), "member_count": len(records), "above_goal": above_goal
        })

    member_ids = set()
    for wk, yr in available:
        recs = db.query(MemberPerformanceMetric.member_id).filter(
            MemberPerformanceMetric.metric_code == metric_code,
            MemberPerformanceMetric.week_number == wk,
            MemberPerformanceMetric.year == yr,
            MemberPerformanceMetric.member_id.in_(filtered_member_ids)
        ).all()
        member_ids.update(r[0] for r in recs)

    member_trends = []
    for mid in member_ids:
        member = db.query(TeamMember).filter(TeamMember.id == mid).first()
        if not member:
            continue
        scores = []
        for wk, yr in available:
            rec = db.query(MemberPerformanceMetric).filter(
                MemberPerformanceMetric.metric_code == metric_code,
                MemberPerformanceMetric.member_id == mid,
                MemberPerformanceMetric.week_number == wk,
                MemberPerformanceMetric.year == yr
            ).first()
            scores.append({
                "week": wk, "year": yr,
                "value": round(rec.metric_value, 2) if rec else None,
                "score": round(rec.normalized_score, 2) if rec else None
            })
        member_trends.append({
            "member_id": mid, "name": member.name,
            "employee_id": member.employee_id or "", "weeks": scores
        })

    return {
        "metric_name": metric.metric_name, "metric_code": metric_code,
        "unit": metric.unit or "", "goal_value": metric.goal_value,
        "is_higher_better": metric.is_higher_better,
        "week_trend": week_data, "member_trends": member_trends
    }


@router.get("/my-performance")
def get_my_performance(
    weeks: int = 6,
    member_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if member_id and current_user.role == "manager":
        member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    else:
        member = db.query(TeamMember).filter(
            (TeamMember.user_id == current_user.id) |
            (TeamMember.email == current_user.email) |
            (TeamMember.employee_id == current_user.login)
        ).first()
    if not member:
        return {"metrics": [], "weeks": []}

    team_metrics = db.query(MetricGoal).filter(MetricGoal.is_active == True).all()
    if not team_metrics:
        return {"metrics": [], "weeks": []}

    available = db.query(
        MemberPerformanceMetric.week_number, MemberPerformanceMetric.year
    ).filter(
        MemberPerformanceMetric.member_id == member.id
    ).distinct().order_by(
        MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()
    ).limit(weeks).all()
    available.reverse()

    week_labels = [{"week": w, "year": y} for w, y in available]

    result_metrics = []
    for tm in team_metrics:
        week_scores = []
        for wk, yr in available:
            rec = db.query(MemberPerformanceMetric).filter(
                MemberPerformanceMetric.member_id == member.id,
                MemberPerformanceMetric.metric_code == tm.metric_code,
                MemberPerformanceMetric.week_number == wk,
                MemberPerformanceMetric.year == yr
            ).first()
            week_scores.append({
                "week": wk, "year": yr,
                "value": round(rec.metric_value, 2) if rec else None,
                "score": round(rec.normalized_score, 2) if rec else None
            })

        latest = next((s for s in reversed(week_scores) if s["score"] is not None), None)
        prev = None
        for i in range(len(week_scores) - 2, -1, -1):
            if week_scores[i]["score"] is not None:
                prev = week_scores[i]
                break
        trend = round(latest["score"] - prev["score"], 2) if latest and prev else None

        result_metrics.append({
            "metric_code": tm.metric_code, "metric_name": tm.metric_name,
            "unit": tm.unit or "", "goal_value": tm.goal_value,
            "is_higher_better": tm.is_higher_better,
            "current_value": latest["value"] if latest else None,
            "current_score": latest["score"] if latest else None,
            "trend": trend, "weeks": week_scores
        })

    scores_with_data = [m["current_score"] for m in result_metrics if m["current_score"] is not None]
    overall = round(sum(scores_with_data) / len(scores_with_data), 2) if scores_with_data else None

    return {
        "member_name": member.name, "employee_id": member.employee_id or "",
        "photo_url": member.photo_url, "overall_score": overall,
        "metrics": result_metrics, "weeks": week_labels
    }
