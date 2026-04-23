"""Performance Analytics API for PulseBoard V10."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.team_member import TeamMember
from app.models.member_performance_metric import MemberPerformanceMetric
from app.models.metric_goal import MetricGoal
from app.api.profile import photo_url

router = APIRouter(prefix="/api/performance-analytics", tags=["Performance Analytics"])


def get_team_members(db: Session, current_user: User):
    if current_user.role == "manager":
        user_ids = db.query(User.id).filter(
            User.team_name == current_user.team_name,
            User.manager_login == current_user.login,
            User.role == "specialist", User.is_active == True
        ).all()
        return db.query(TeamMember).filter(TeamMember.user_id.in_([u[0] for u in user_ids]), TeamMember.is_active == True).all()
    else:
        manager_login = current_user.manager_login
        if not manager_login:
            return []
        user_ids = db.query(User.id).filter(
            User.team_name == current_user.team_name,
            User.manager_login == manager_login,
            User.role == "specialist", User.is_active == True
        ).all()
        return db.query(TeamMember).filter(TeamMember.user_id.in_([u[0] for u in user_ids]), TeamMember.is_active == True).all()


def get_metric_configs(db: Session):
    return db.query(MetricGoal).filter(MetricGoal.is_active == True).all()


@router.get("/simple-view")
def get_simple_view(week: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    year = datetime.now().year
    if not week:
        week = datetime.now().isocalendar()[1]

    members = get_team_members(db, current_user)
    configs = get_metric_configs(db)

    if not members:
        manager = db.query(User).filter(User.login == current_user.login).first()
        return {
            "members": [], "available_weeks": [],
            "team_metrics": [{"metric_code": c.metric_code, "metric_name": c.metric_name, "unit": c.unit, "goal_value": c.goal_value, "is_higher_better": c.is_higher_better, "avg_value": 0, "avg_score": 0} for c in configs],
            "team_name": current_user.team_name, "manager_name": current_user.name, "manager_photo_url": photo_url(manager), "manager_login": current_user.login
        }

    available_weeks = [w[0] for w in db.query(func.distinct(MemberPerformanceMetric.week_number)).order_by(MemberPerformanceMetric.week_number.desc()).all()]

    current_metrics = db.query(MemberPerformanceMetric).filter(MemberPerformanceMetric.week_number == week, MemberPerformanceMetric.year == year).all()
    if not current_metrics:
        latest = db.query(MemberPerformanceMetric.week_number, MemberPerformanceMetric.year).order_by(MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()).first()
        if latest:
            week, year = latest
            current_metrics = db.query(MemberPerformanceMetric).filter(MemberPerformanceMetric.week_number == week, MemberPerformanceMetric.year == year).all()

    prev_metrics = db.query(MemberPerformanceMetric).filter(MemberPerformanceMetric.week_number == week - 1, MemberPerformanceMetric.year == year).all() if week > 1 else []

    member_ids = [m.id for m in members]
    user_map = {u.id: u for u in db.query(User).filter(User.id.in_([m.user_id for m in members if m.user_id])).all()}

    team_metrics = []
    for c in configs:
        code_metrics = [m for m in current_metrics if m.metric_code == c.metric_code and m.member_id in member_ids]
        avg_val = sum(m.metric_value for m in code_metrics) / len(code_metrics) if code_metrics else 0
        avg_score = sum(m.normalized_score for m in code_metrics) / len(code_metrics) if code_metrics else 0
        team_metrics.append({"metric_code": c.metric_code, "metric_name": c.metric_name, "unit": c.unit, "goal_value": c.goal_value, "is_higher_better": c.is_higher_better, "avg_value": round(avg_val, 2), "avg_score": round(avg_score, 2)})

    result = []
    for member in members:
        mc = [m for m in current_metrics if m.member_id == member.id]
        mp = [m for m in prev_metrics if m.member_id == member.id]
        if mc:
            metrics_data = {}
            for perf in mc:
                prev = next((m for m in mp if m.metric_code == perf.metric_code), None)
                metrics_data[perf.metric_code] = {"value": round(perf.metric_value, 2), "score": round(perf.normalized_score, 2), "trend": round(perf.normalized_score - prev.normalized_score, 2) if prev else None}
            avg_score = sum(p.normalized_score for p in mc) / len(mc)
            prev_avg = sum(p.normalized_score for p in mp) / len(mp) if mp else 0
            result.append({
                "member_id": member.id, "member_name": member.name, "login_id": member.employee_id,
                "photo_url": photo_url(user_map.get(member.user_id)),
                "metrics": metrics_data, "avg_score": round(avg_score, 2), "prev_score": round(prev_avg, 2),
                "trend": round(avg_score - prev_avg, 2) if prev_avg else 0,
                "category": "Excellent" if avg_score >= 90 else "Strong" if avg_score >= 80 else "Need Attention"
            })

    result.sort(key=lambda x: x["avg_score"], reverse=True)
    manager = db.query(User).filter(User.login == current_user.login if current_user.role == "manager" else User.login == current_user.manager_login).first()

    return {
        "members": result, "team_metrics": team_metrics, "available_weeks": available_weeks,
        "current_week": week, "current_year": year,
        "team_name": current_user.team_name, "manager_name": manager.name if manager else "", "manager_photo_url": photo_url(manager), "manager_login": manager.login if manager else ""
    }


def generate_ai_insights(member_data, metrics):
    score = member_data.get("score", 0)
    strengths = [m for m in metrics if m["score"] >= 90]
    weaknesses = [m for m in metrics if m["score"] < 70]
    insights = []
    if score >= 90: insights.append(f"🌟 Outstanding performer with {score:.1f}% overall score.")
    elif score >= 75: insights.append(f"💪 Strong performer with {score:.1f}% overall score.")
    elif score >= 60: insights.append(f"📈 Solid performer with {score:.1f}% overall score.")
    else: insights.append(f"⚠️ Needs improvement - {score:.1f}% overall score.")
    if strengths: insights.append(f"Excels in {strengths[0]['name']} ({strengths[0]['score']:.1f}%).")
    if weaknesses:
        w = weaknesses[0]
        insights.append(f"Focus on improving {w['name']} ({w['score']:.1f}%).")
        tips = {"ACHT": "💡 Reduce handling time through better tool utilization.", "MISSED": "💡 Improve schedule adherence.", "ROR": "💡 Enhance first-contact resolution.", "QA": "💡 Review quality audit feedback."}
        insights.append(tips.get(w["code"].upper(), ""))
    else:
        insights.append("All metrics performing well!")
    return " ".join(insights)


@router.get("/dashboard")
def get_dashboard(week: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    year = datetime.now().year
    if not week:
        week = datetime.now().isocalendar()[1]

    configs = get_metric_configs(db)
    members = get_team_members(db, current_user)

    perf_data = db.query(MemberPerformanceMetric).filter(MemberPerformanceMetric.week_number == week, MemberPerformanceMetric.year == year).all()
    if not perf_data:
        latest = db.query(MemberPerformanceMetric.week_number, MemberPerformanceMetric.year).order_by(MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()).first()
        if latest:
            week, year = latest
            perf_data = db.query(MemberPerformanceMetric).filter(MemberPerformanceMetric.week_number == week, MemberPerformanceMetric.year == year).all()

    if not perf_data or not configs:
        return {"overall_team_score": 0, "score_distribution": {"green": 0, "yellow": 0, "red": 0}, "metric_cards": [], "top_podium": [], "leaderboard": [], "current_week": week, "current_year": year, "has_data": False}

    prev_data = db.query(MemberPerformanceMetric).filter(MemberPerformanceMetric.week_number == week - 1, MemberPerformanceMetric.year == year).all() if week > 1 else []
    user_map2 = {u.id: u for u in db.query(User).filter(User.id.in_([m.user_id for m in members if m.user_id])).all()}

    metric_cards = []
    for c in configs:
        cm = [m for m in perf_data if m.metric_code == c.metric_code]
        if cm:
            metric_cards.append({"metric_code": c.metric_code, "metric_name": c.metric_name, "unit": c.unit, "goal_value": c.goal_value, "average_score": round(sum(m.normalized_score for m in cm) / len(cm), 2), "is_higher_better": c.is_higher_better})

    total_weight = sum(c.weight for c in configs) or 1
    member_scores = []
    for member in members:
        mp = [p for p in perf_data if p.member_id == member.id]
        if not mp:
            continue
        member_metrics = []
        for c in configs:
            perf = next((p for p in mp if p.metric_code == c.metric_code), None)
            if perf:
                member_metrics.append({"code": c.metric_code, "name": c.metric_name, "score": perf.normalized_score, "value": perf.metric_value})

        if member_metrics:
            available_weight = sum(next(c.weight for c in configs if c.metric_code == m["code"]) for m in member_metrics)
            overall = sum(m["score"] * next(c.weight for c in configs if c.metric_code == m["code"]) for m in member_metrics) / available_weight if available_weight > 0 else 0
            prev_mp = [p for p in prev_data if p.member_id == member.id]
            metric_trends = {}
            for m in member_metrics:
                pp = next((p for p in prev_mp if p.metric_code == m["code"]), None)
                metric_trends[m["code"]] = round(m["score"] - pp.normalized_score, 2) if pp else None

            prev_metrics_list = [{"code": c.metric_code, "score": next((p.normalized_score for p in prev_mp if p.metric_code == c.metric_code), 0)} for c in configs if any(p.metric_code == c.metric_code for p in prev_mp)]
            prev_available_weight = sum(next(c.weight for c in configs if c.metric_code == m["code"]) for m in prev_metrics_list) if prev_metrics_list else 0
            prev_overall = sum(m["score"] * next(c.weight for c in configs if c.metric_code == m["code"]) for m in prev_metrics_list) / prev_available_weight if prev_available_weight > 0 else None
            score_trend = round(overall - prev_overall, 2) if prev_overall else None

            photo = photo_url(user_map2.get(member.user_id))
            data = {
                "member_id": member.id, "name": member.name, "email": member.email, "employee_id": member.employee_id,
                "photo_url": photo, "score": round(overall, 2), "score_trend": score_trend,
                "metrics": {m["code"]: round(m["score"], 2) for m in member_metrics},
                "metric_trends": metric_trends, "metric_details": member_metrics
            }
            data["ai_insight"] = generate_ai_insights(data, member_metrics)
            member_scores.append(data)

    member_scores.sort(key=lambda x: x["score"], reverse=True)
    team_score = sum(m["score"] for m in member_scores) / len(member_scores) if member_scores else 0

    return {
        "overall_team_score": round(team_score, 2),
        "score_distribution": {"green": sum(1 for m in member_scores if m["score"] >= 90), "yellow": sum(1 for m in member_scores if 80 <= m["score"] < 90), "red": sum(1 for m in member_scores if m["score"] < 80)},
        "metric_cards": metric_cards, "top_podium": member_scores[:3], "leaderboard": member_scores,
        "current_week": week, "current_year": year, "has_data": True
    }


@router.get("/member/{member_id}/details")
def get_member_details(member_id: int, week: int = None, year: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get detailed performance data for a specific member."""
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if not year:
        year = datetime.now().year
    if not week:
        latest = db.query(MemberPerformanceMetric.week_number, MemberPerformanceMetric.year).filter(
            MemberPerformanceMetric.member_id == member_id
        ).order_by(MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()).first()
        if latest:
            week, year = latest

    metrics = db.query(MemberPerformanceMetric).filter(
        MemberPerformanceMetric.member_id == member_id,
        MemberPerformanceMetric.week_number == week,
        MemberPerformanceMetric.year == year
    ).all() if week else []

    return {
        "member": {"id": member.id, "name": member.name, "email": member.email, "employee_id": member.employee_id},
        "metrics": [{"metric_code": m.metric_code, "metric_value": m.metric_value, "normalized_score": m.normalized_score, "raw_data": m.raw_data} for m in metrics]
    }


@router.get("/metric-cards/{metric_code}/members")
def get_metric_members(metric_code: str, week: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    year = datetime.now().year
    if not week:
        latest = db.query(MemberPerformanceMetric.week_number, MemberPerformanceMetric.year).order_by(MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()).first()
        if latest:
            week, year = latest

    members = get_team_members(db, current_user)
    member_ids = [m.id for m in members]
    member_map = {m.id: m for m in members}

    metrics = db.query(MemberPerformanceMetric).filter(
        MemberPerformanceMetric.metric_code == metric_code,
        MemberPerformanceMetric.member_id.in_(member_ids),
        MemberPerformanceMetric.week_number == week,
        MemberPerformanceMetric.year == year
    ).all()

    result = [{"member_id": m.member_id, "name": member_map[m.member_id].name, "employee_id": member_map[m.member_id].employee_id, "score": m.normalized_score, "value": m.metric_value} for m in metrics if m.member_id in member_map]
    result.sort(key=lambda x: x["score"], reverse=True)
    return result
