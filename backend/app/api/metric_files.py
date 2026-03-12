"""Metric File Processing API - Ported from PulseBoard V1."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.metric_file import MetricFile
from app.models.metric_goal import MetricGoal
from app.models.team_member import TeamMember
from app.models.member_performance_metric import MemberPerformanceMetric
import pandas as pd
import os

router = APIRouter(prefix="/api/metric-files", tags=["metric-files"])

UPLOAD_DIR = "uploads/metrics"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_metric_file(
    metric_code: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{metric_code}_{file.filename}")
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    metric_file = MetricFile(
        user_id=current_user.id,
        metric_code=metric_code,
        file_name=file.filename,
        file_path=file_path,
        processed=False
    )
    db.add(metric_file)
    db.commit()
    db.refresh(metric_file)

    return {"message": "File uploaded successfully", "file_id": metric_file.id}


@router.get("/")
def get_uploaded_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    files = db.query(MetricFile).filter(
        MetricFile.user_id == current_user.id
    ).order_by(MetricFile.uploaded_at.desc()).all()

    return [{"id": f.id, "metric_code": f.metric_code, "metric_name": f.metric_code.upper(), "file_name": f.file_name, "uploaded_at": f.uploaded_at.isoformat(), "processed": f.processed} for f in files]


@router.post("/{file_id}/process")
def process_metric_file(
    file_id: int,
    metric_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    metric_file = db.query(MetricFile).filter(
        MetricFile.id == file_id,
        MetricFile.user_id == current_user.id
    ).first()

    if not metric_file:
        raise HTTPException(status_code=404, detail="File not found")

    if metric_file.processed:
        raise HTTPException(status_code=400, detail="File already processed")

    try:
        df = pd.read_excel(metric_file.file_path, sheet_name=0)

        # Get team users by manager's team
        team_users = db.query(User).filter(
            User.team_name == current_user.team_name,
            User.is_active == True
        ).all()

        member_map = {u.login.lower(): u for u in team_users if u.login}

        # Get metric goal
        metric_goal = db.query(MetricGoal).filter(
            MetricGoal.metric_code == metric_code,
            MetricGoal.is_active == True
        ).first()

        goal_value = float(metric_goal.goal_value) if metric_goal and metric_goal.goal_value else 0

        weekly_summary = {}
        case_details = []

        for _, row in df.iterrows():
            login_id = str(row['Specialist']).strip().lower()
            user = member_map.get(login_id)

            if not user:
                continue

            acht_value = float(row['ACHT (in min)'])

            week_str = str(row['Week'])
            week_no = int(week_str.split()[-1]) if 'Week' in week_str else 6

            case_id = str(row['Case ID'])

            case_details.append({
                'login_id': user.login,
                'member_name': user.name,
                'week_no': week_no,
                'case_id': case_id,
                'acht': acht_value
            })

            key = f"{user.login}_{week_no}"
            if key not in weekly_summary:
                weekly_summary[key] = {
                    'login_id': user.login,
                    'member_name': user.name,
                    'week_no': week_no,
                    'total_acht': 0,
                    'count': 0,
                    'longtail_count': 0
                }

            weekly_summary[key]['total_acht'] += acht_value
            weekly_summary[key]['count'] += 1
            if acht_value >= 45:
                weekly_summary[key]['longtail_count'] += 1

        # Calculate averages
        weekly_data = []
        for data in weekly_summary.values():
            avg_acht = data['total_acht'] / data['count'] if data['count'] > 0 else 0
            variance = round(avg_acht - goal_value, 2)
            achieved_pct = round((goal_value / avg_acht * 100), 2) if avg_acht > 0 else 0

            weekly_data.append({
                'login_id': data['login_id'],
                'member_name': data['member_name'],
                'week_no': data['week_no'],
                'avg_acht': round(avg_acht, 2),
                'goal': goal_value,
                'variance': variance,
                'achieved': achieved_pct,
                'total_cases': data['count'],
                'longtail_count': data['longtail_count']
            })

        metric_file.processed = True
        db.commit()

        return {
            'message': 'File processed successfully',
            'total_records': len(df),
            'processed_records': len(case_details),
            'weekly_summary': sorted(weekly_data, key=lambda x: (x['week_no'], x['member_name'])),
            'case_details': case_details,
            'total_longtail': sum(w['longtail_count'] for w in weekly_data)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.delete("/{file_id}")
def delete_metric_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    metric_file = db.query(MetricFile).filter(
        MetricFile.id == file_id,
        MetricFile.user_id == current_user.id
    ).first()

    if not metric_file:
        raise HTTPException(status_code=404, detail="File not found")

    if os.path.exists(metric_file.file_path):
        os.remove(metric_file.file_path)

    db.delete(metric_file)
    db.commit()

    return {"message": "File deleted successfully"}
