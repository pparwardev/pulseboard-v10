"""Metric Configuration API for PulseBoard V10."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.metric_goal import MetricGoal

router = APIRouter(prefix="/api/team-metrics", tags=["Metric Config"])


@router.get("/finalized")
def get_finalized(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    metrics = db.query(MetricGoal).filter(MetricGoal.is_active == True).all()
    team_name = current_user.team_name or "LESC"
    return [{
        "team_id": 1, "team_name": team_name,
        "metrics": [{"id": m.id, "metric_name": m.metric_name, "metric_code": m.metric_code, "description": m.description, "unit": m.unit, "goal_value": m.goal_value, "weight": m.weight, "is_higher_better": m.is_higher_better} for m in metrics]
    }]


@router.post("/")
def create_metric(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Manager only")
    existing = db.query(MetricGoal).filter(MetricGoal.metric_code == data.get("metric_code")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Metric already exists")
    m = MetricGoal(metric_name=data["metric_name"], metric_code=data["metric_code"], unit=data.get("unit", ""), description=data.get("description", ""), is_higher_better=data.get("is_higher_better", True), is_active=True)
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"id": m.id, "metric_name": m.metric_name, "metric_code": m.metric_code, "unit": m.unit, "goal_value": m.goal_value, "weight": m.weight, "is_higher_better": m.is_higher_better, "team_name": current_user.team_name}


@router.patch("/{metric_id}")
def update_metric(metric_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Manager only")
    m = db.query(MetricGoal).filter(MetricGoal.id == metric_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Metric not found")
    for k, v in data.items():
        if hasattr(m, k):
            setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return {"id": m.id, "metric_name": m.metric_name, "metric_code": m.metric_code, "unit": m.unit, "goal_value": m.goal_value, "weight": m.weight, "is_higher_better": m.is_higher_better, "team_name": current_user.team_name}


@router.delete("/{metric_id}")
def delete_metric(metric_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Manager only")
    m = db.query(MetricGoal).filter(MetricGoal.id == metric_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Metric not found")
    m.is_active = False
    db.commit()
    return {"message": "Metric deactivated"}


@router.get("/available-metrics")
def get_available():
    return {"metrics": [
        {"code": "ACHT", "name": "Average Contact Handling Time", "unit": "minutes", "higher_better": False},
        {"code": "QA", "name": "Quality Assurance", "unit": "%", "higher_better": True},
        {"code": "ROR", "name": "Reopen On Resolve", "unit": "%", "higher_better": False},
        {"code": "Missed", "name": "Missed Contact", "unit": "%", "higher_better": False},
    ]}


@router.post("/finalize")
def finalize(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": "Metrics finalized successfully"}


@router.get("/team/{team_id}")
def get_team_metrics(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    metrics = db.query(MetricGoal).filter(MetricGoal.is_active == True).all()
    return [{"id": m.id, "metric_name": m.metric_name, "metric_code": m.metric_code, "unit": m.unit, "goal_value": m.goal_value, "weight": m.weight, "is_higher_better": m.is_higher_better, "description": m.description, "team_name": current_user.team_name} for m in metrics]
