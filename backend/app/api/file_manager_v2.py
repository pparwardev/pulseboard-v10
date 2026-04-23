"""File Manager V2 API - Base64 upload for CloudFront compatibility."""
import os, shutil, re, base64
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import pandas as pd
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.file_upload import FileUpload
from app.models.team_member import TeamMember
from app.models.metric_goal import MetricGoal
from app.models.member_performance_metric import MemberPerformanceMetric

router = APIRouter(prefix="/api/fm2", tags=["File Manager V2"])
UPLOAD_DIR = "uploads/file_manager"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class FileUploadRequest(BaseModel):
    filename: str
    content_type: Optional[str] = "application/octet-stream"
    data: str  # base64 encoded
    metric_code: Optional[str] = None
    week_label: Optional[str] = None


def _get_file(db: Session, file_id: int, current_user: User) -> FileUpload:
    if current_user.role == "manager" and current_user.team_name:
        team_ids = [u.id for u in db.query(User.id).filter(User.team_name == current_user.team_name).all()]
        return db.query(FileUpload).filter(FileUpload.id == file_id, FileUpload.user_id.in_(team_ids)).first()
    return db.query(FileUpload).filter(FileUpload.id == file_id, FileUpload.user_id == current_user.id).first()


def _file_response(fu: FileUpload) -> dict:
    return {
        "id": fu.id, "name": fu.original_filename, "size": fu.file_size,
        "type": fu.file_type, "metric_code": fu.metric_code,
        "week_label": fu.week_label, "uploaded_at": fu.uploaded_at.isoformat(),
        "url": f"/api/fm2/download/{fu.id}"
    }


@router.post("/upload")
async def upload_file(req: FileUploadRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = base64.b64decode(req.data)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = f"{req.metric_code}_" if req.metric_code else ""
    stored = f"{current_user.id}_{prefix}{ts}_{req.filename}"
    path = os.path.join(UPLOAD_DIR, stored)
    with open(path, "wb") as f:
        f.write(data)
    fu = FileUpload(
        user_id=current_user.id, filename=stored, original_filename=req.filename,
        file_path=path, file_size=len(data), file_type=req.content_type or "application/octet-stream",
        metric_code=req.metric_code, week_label=req.week_label
    )
    db.add(fu)
    db.commit()
    db.refresh(fu)
    return _file_response(fu)


@router.get("/files")
async def get_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "manager" and current_user.team_name:
        team_ids = [u.id for u in db.query(User.id).filter(User.team_name == current_user.team_name).all()]
        files = db.query(FileUpload).filter(FileUpload.user_id.in_(team_ids)).order_by(FileUpload.uploaded_at.desc()).all()
    else:
        files = db.query(FileUpload).filter(FileUpload.user_id == current_user.id).order_by(FileUpload.uploaded_at.desc()).all()
    return [_file_response(f) for f in files]


@router.get("/download/{file_id}")
async def download_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = db.query(FileUpload).filter(FileUpload.id == file_id).first()
    if not fu or not os.path.exists(fu.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fu.file_path, filename=fu.original_filename, media_type=fu.file_type)


@router.get("/view/{file_id}")
async def view_file(file_id: int, token: str = Query(...), db: Session = Depends(get_db)):
    from app.core.security import decode_access_token
    try:
        payload = decode_access_token(token)
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    fu = db.query(FileUpload).filter(FileUpload.id == file_id).first()
    if not fu or not os.path.exists(fu.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fu.file_path, filename=fu.original_filename, media_type=fu.file_type)


@router.get("/published-files")
async def get_published_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    published = db.query(
        MemberPerformanceMetric.source_file, MemberPerformanceMetric.metric_code
    ).filter(MemberPerformanceMetric.source_file != None).distinct().all()
    result, seen = [], set()
    for src, mc in published:
        if not src or src in seen:
            continue
        seen.add(src)
        if current_user.role == "manager" and current_user.team_name:
            team_ids = [u.id for u in db.query(User.id).filter(User.team_name == current_user.team_name).all()]
            fu = db.query(FileUpload).filter(FileUpload.original_filename == src, FileUpload.user_id.in_(team_ids)).first()
        else:
            fu = db.query(FileUpload).filter(FileUpload.original_filename == src, FileUpload.user_id == current_user.id).first()
        weeks = [f"W{w[0]}" for w in db.query(MemberPerformanceMetric.week_number, MemberPerformanceMetric.year).filter(
            MemberPerformanceMetric.source_file == src).distinct().order_by(
            MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()).all()]
        result.append({
            'id': fu.id if fu else None, 'name': src, 'metric_code': mc,
            'week_label': fu.week_label if fu else '', 'weeks_published': weeks,
            'uploaded_at': fu.uploaded_at.isoformat() if fu else '', 'size': fu.file_size if fu else 0,
        })
    return result


@router.delete("/delete/{file_id}")
async def delete_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = _get_file(db, file_id, current_user)
    if not fu:
        raise HTTPException(status_code=404, detail="File not found")
    if os.path.exists(fu.file_path):
        os.remove(fu.file_path)
    db.delete(fu)
    db.commit()
    return {"message": "File deleted"}


@router.post("/process-missed/{file_id}")
async def process_missed(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = _get_file(db, file_id, current_user)
    if not fu:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(fu.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    is_excel = fu.file_path.endswith('.xlsx') or fu.file_path.endswith('.xls')
    if not is_excel:
        raise HTTPException(status_code=400, detail="Only Excel files supported for missed contacts")
    try:
        team_users = db.query(User).filter(User.team_name == current_user.team_name, User.is_active == True).all()
        member_map = {u.login.lower(): u for u in team_users if u.login}
        df = pd.read_excel(fu.file_path, sheet_name=0, header=None)
        header_row = None
        for i in range(min(10, len(df))):
            vals = [str(v).strip().lower() if pd.notna(v) else '' for v in df.iloc[i]]
            if 'associate' in vals and 'overall offered' in vals:
                header_row = i
                break
        if header_row is None:
            raise HTTPException(status_code=400, detail="Could not find header row")
        headers = [str(v).strip() if pd.notna(v) else '' for v in df.iloc[header_row]]
        data_df = df.iloc[header_row + 1:].reset_index(drop=True)
        data_df.columns = headers
        cur_week, cur_assoc = '', ''
        specialist_data = {}
        for _, row in data_df.iterrows():
            wv = row.get('By Week', '')
            av = row.get('Associate', '')
            if pd.notna(wv) and str(wv).strip(): cur_week = str(wv).strip()
            if pd.notna(av) and str(av).strip(): cur_assoc = str(av).strip().lower()
            if not cur_assoc: continue
            key = (cur_week, cur_assoc)
            if key not in specialist_data:
                specialist_data[key] = {
                    'week': cur_week, 'login': cur_assoc,
                    'name': member_map[cur_assoc].name if cur_assoc in member_map else cur_assoc,
                    'overall_offered': 0, 'overall_missed': 0,
                    'chat_offered': 0, 'chat_missed': 0,
                    'voice_offered': 0, 'voice_missed': 0,
                    'wi_offered': 0, 'wi_missed': 0,
                }
            def si(v):
                try: return int(float(v)) if pd.notna(v) else 0
                except: return 0
            for col in ['overall_offered','overall_missed','chat_offered','chat_missed','voice_offered','voice_missed','wi_offered','wi_missed']:
                header_name = col.replace('_', ' ').title().replace('Wi ', 'WI ')
                specialist_data[key][col] += si(row.get(header_name, 0))
        result = []
        for d in specialist_data.values():
            d['overall_missed_pct'] = round(d['overall_missed'] / d['overall_offered'] * 100, 2) if d['overall_offered'] > 0 else 0
            d['chat_missed_pct'] = round(d['chat_missed'] / d['chat_offered'] * 100, 2) if d['chat_offered'] > 0 else 0
            d['voice_missed_pct'] = round(d['voice_missed'] / d['voice_offered'] * 100, 2) if d['voice_offered'] > 0 else 0
            d['wi_missed_pct'] = round(d['wi_missed'] / d['wi_offered'] * 100, 2) if d['wi_offered'] > 0 else 0
            d['missed_contact_rate_live'] = d['overall_missed_pct']
            result.append(d)
        result.sort(key=lambda x: (x['week'], -x['overall_missed_pct']))
        return {
            'message': 'Missed contacts processed', 'week_label': fu.week_label or '',
            'total_specialists': len(set(d['login'] for d in result)),
            'total_records': len(result), 'specialist_data': result
        }
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.post("/publish-missed/{file_id}")
async def publish_missed(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = _get_file(db, file_id, current_user)
    if not fu:
        raise HTTPException(status_code=404, detail="File not found")
    metric = db.query(MetricGoal).filter(MetricGoal.metric_code == 'Missed', MetricGoal.is_active == True).first()
    if not metric:
        raise HTTPException(status_code=404, detail="Missed metric not configured")
    goal = float(metric.goal_value) if metric.goal_value else 2.0
    team_users = db.query(User).filter(User.team_name == current_user.team_name, User.is_active == True).all()
    member_map = {u.login.lower(): u for u in team_users if u.login}
    processed = (await process_missed(file_id, db=db, current_user=current_user))
    tm_all = db.query(TeamMember).filter(TeamMember.is_active == True).all()
    tm_map = {tm.employee_id.lower(): tm for tm in tm_all if tm.employee_id}
    member_ids = [tm.id for tm in tm_map.values()]
    weeks_published, count = {}, 0
    for row in processed['specialist_data']:
        login = row.get('login', '').lower()
        tm = tm_map.get(login)
        if not tm: continue
        wf = str(row.get('week', '')).strip()
        m = re.search(r'(\d{4})\s*Week\s*(\d+)', wf)
        if m:
            yr, wk = int(m.group(1)), int(m.group(2))
        elif fu.week_label:
            m2 = re.search(r'Week\s+(\d+)\s*-\s*(\d{4})', fu.week_label)
            if m2: wk, yr = int(m2.group(1)), int(m2.group(2))
            else: continue
        else: continue
        key = (yr, wk)
        if key not in weeks_published and member_ids:
            db.query(MemberPerformanceMetric).filter(
                MemberPerformanceMetric.metric_code == 'Missed',
                MemberPerformanceMetric.week_number == wk,
                MemberPerformanceMetric.year == yr,
                MemberPerformanceMetric.member_id.in_(member_ids)
            ).delete(synchronize_session=False)
            weeks_published[key] = 0
        pct = float(row.get('overall_missed_pct', 0))
        score = max(0, min(100, (1 - pct / (goal * 2)) * 100)) if goal > 0 else (100.0 if pct == 0 else 0.0)
        db.add(MemberPerformanceMetric(
            member_id=tm.id, metric_code='Missed', metric_value=pct,
            normalized_score=round(score, 2), week_number=wk, year=yr,
            source_file=fu.original_filename, raw_data={k: v for k, v in row.items() if k != 'name'}
        ))
        count += 1
        weeks_published[key] = weeks_published.get(key, 0) + 1
    db.commit()
    return {
        'message': f'Published Missed data for {len(weeks_published)} week(s)',
        'published_count': count,
        'weeks_published': [{'week': wk, 'year': yr, 'count': c} for (yr, wk), c in sorted(weeks_published.items())],
        'metric_code': 'Missed'
    }
