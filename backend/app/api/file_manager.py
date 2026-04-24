"""File Manager API for PulseBoard V10."""
import os, shutil, re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import pandas as pd
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.file_upload import FileUpload
from app.models.team_member import TeamMember
from app.models.metric_goal import MetricGoal
from app.models.member_performance_metric import MemberPerformanceMetric
import pdfplumber

router = APIRouter(prefix="/api/file-manager", tags=["File Manager"])
UPLOAD_DIR = "uploads/file_manager"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_file_for_user(db: Session, file_id: int, current_user: User) -> FileUpload:
    """Get file by id, allowing managers to access any team member's files."""
    if current_user.role == "manager" and current_user.team_name:
        team_user_ids = [u.id for u in db.query(User.id).filter(User.team_name == current_user.team_name).all()]
        return db.query(FileUpload).filter(FileUpload.id == file_id, FileUpload.user_id.in_(team_user_ids)).first()
    return db.query(FileUpload).filter(FileUpload.id == file_id, FileUpload.user_id == current_user.id).first()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), metric_code: str = None, week_label: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = f"{metric_code}_" if metric_code else ""
    filename = f"{current_user.id}_{prefix}{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    file_size = os.path.getsize(file_path)
    fu = FileUpload(user_id=current_user.id, filename=filename, original_filename=file.filename, file_path=file_path, file_size=file_size, file_type=file.content_type or "application/octet-stream", metric_code=metric_code, week_label=week_label)
    db.add(fu)
    db.commit()
    db.refresh(fu)
    return {"id": fu.id, "name": fu.original_filename, "size": fu.file_size, "type": fu.file_type, "metric_code": fu.metric_code, "uploaded_at": fu.uploaded_at.isoformat(), "week_label": fu.week_label, "url": f"/api/file-manager/download/{fu.id}"}


@router.post("/upload-base64")
async def upload_file_base64(request: dict, metric_code: str = None, week_label: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    import base64
    from werkzeug.utils import secure_filename
    
    filename = request.get('filename', 'upload.bin')
    content_type = request.get('content_type', 'application/octet-stream')
    base64_data = request.get('data', '')
    
    # Validate file size before decoding (base64 is ~33% larger than original)
    estimated_size = len(base64_data) * 3 // 4
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
    if estimated_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB")
    
    # Validate filename to prevent path traversal
    safe_filename = secure_filename(filename)
    if not safe_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    # Validate file extension
    ALLOWED_EXTENSIONS = {'.xlsx', '.xls', '.csv', '.xlsm', '.xlsb', '.pdf', '.doc', '.docx'}
    file_ext = os.path.splitext(safe_filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    try:
        data = base64.b64decode(base64_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 data")
    
    # Final size check after decoding
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = f"{metric_code}_" if metric_code else ""
    stored_name = f"{current_user.id}_{prefix}{timestamp}_{safe_filename}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)
    
    # Ensure the upload directory exists and is secure
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    with open(file_path, "wb") as f:
        f.write(data)
    
    file_size = len(data)
    fu = FileUpload(user_id=current_user.id, filename=stored_name, original_filename=safe_filename, file_path=file_path, file_size=file_size, file_type=content_type, metric_code=metric_code, week_label=week_label)
    db.add(fu)
    db.commit()
    db.refresh(fu)
    return {"id": fu.id, "name": fu.original_filename, "size": fu.file_size, "type": fu.file_type, "metric_code": fu.metric_code, "uploaded_at": fu.uploaded_at.isoformat(), "week_label": fu.week_label, "url": f"/api/file-manager/download/{fu.id}"}


@router.get("/files")
async def get_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "manager" and current_user.team_name:
        team_user_ids = [u.id for u in db.query(User.id).filter(User.team_name == current_user.team_name).all()]
        files = db.query(FileUpload).filter(FileUpload.user_id.in_(team_user_ids)).order_by(FileUpload.uploaded_at.desc()).all()
    else:
        files = db.query(FileUpload).filter(FileUpload.user_id == current_user.id).order_by(FileUpload.uploaded_at.desc()).all()
    return [{"id": f.id, "name": f.original_filename, "size": f.file_size, "type": f.file_type or "application/octet-stream", "metric_code": f.metric_code, "week_label": f.week_label, "uploaded_at": f.uploaded_at.isoformat(), "url": f"/api/file-manager/download/{f.id}"} for f in files]


@router.get("/published-files")
async def get_published_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get distinct source files from published metrics
    published_sources = db.query(
        MemberPerformanceMetric.source_file,
        MemberPerformanceMetric.metric_code
    ).filter(
        MemberPerformanceMetric.source_file != None
    ).distinct().all()

    # Match with FileUpload records
    result = []
    seen = set()
    for source_file, metric_code in published_sources:
        if not source_file or source_file in seen:
            continue
        seen.add(source_file)
        if current_user.role == "manager" and current_user.team_name:
            team_user_ids = [u.id for u in db.query(User.id).filter(User.team_name == current_user.team_name).all()]
            fu = db.query(FileUpload).filter(FileUpload.original_filename == source_file, FileUpload.user_id.in_(team_user_ids)).first()
        else:
            fu = db.query(FileUpload).filter(FileUpload.original_filename == source_file, FileUpload.user_id == current_user.id).first()
        # Get weeks published for this file
        weeks = db.query(
            MemberPerformanceMetric.week_number, MemberPerformanceMetric.year
        ).filter(
            MemberPerformanceMetric.source_file == source_file
        ).distinct().order_by(
            MemberPerformanceMetric.year.desc(), MemberPerformanceMetric.week_number.desc()
        ).all()
        weeks_list = [f"W{w[0]}" for w in weeks]

        result.append({
            'id': fu.id if fu else None,
            'name': source_file,
            'metric_code': metric_code,
            'week_label': fu.week_label if fu else '',
            'weeks_published': weeks_list,
            'uploaded_at': fu.uploaded_at.isoformat() if fu else '',
            'size': fu.file_size if fu else 0,
        })
    return result


@router.get("/download/{file_id}")
async def download_file(file_id: int, token: str = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = db.query(FileUpload).filter(FileUpload.id == file_id).first()
    if not fu or not os.path.exists(fu.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fu.file_path, filename=fu.original_filename, media_type=fu.file_type)


@router.get("/view/{file_id}")
async def view_file(file_id: int, token: str = Query(...), db: Session = Depends(get_db)):
    """Token-based file access for browser-native elements (img, video, a href)."""
    from app.core.security import decode_access_token
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    fu = db.query(FileUpload).filter(FileUpload.id == file_id).first()
    if not fu or not os.path.exists(fu.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fu.file_path, filename=fu.original_filename, media_type=fu.file_type)


@router.post("/process-missed/{file_id}")
async def process_missed_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = _get_file_for_user(db, file_id, current_user)
    if not fu:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(fu.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    is_excel = fu.file_path.endswith('.xlsx') or fu.file_path.endswith('.xls')
    is_pdf = fu.file_path.endswith('.pdf')

    if not is_excel and not is_pdf:
        raise HTTPException(status_code=400, detail="Only Excel or PDF files supported")

    try:
        team_users = db.query(User).filter(
            User.team_name == current_user.team_name,
            User.is_active == True
        ).all()
        member_map = {u.login.lower(): u for u in team_users if u.login}

        if is_excel:
            return _process_missed_excel(fu, member_map)
        else:
            return _process_missed_pdf(fu, member_map)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


def _process_missed_excel(fu, member_map):
    df = pd.read_excel(fu.file_path, sheet_name=0, header=None)
    # Find header row
    header_row = None
    for i in range(min(10, len(df))):
        row_vals = [str(v).strip().lower() if pd.notna(v) else '' for v in df.iloc[i]]
        if 'associate' in row_vals and 'overall offered' in row_vals:
            header_row = i
            break
    if header_row is None:
        raise HTTPException(status_code=400, detail="Could not find header row in Excel")

    headers = [str(v).strip() if pd.notna(v) else '' for v in df.iloc[header_row]]
    data_df = df.iloc[header_row + 1:].reset_index(drop=True)
    data_df.columns = headers

    # Parse rows: forward-fill Week and Associate
    current_week = ''
    current_associate = ''
    specialist_data = {}  # key: (week, associate)

    for _, row in data_df.iterrows():
        week_val = row.get('By Week', '')
        assoc_val = row.get('Associate', '')

        if pd.notna(week_val) and str(week_val).strip():
            current_week = str(week_val).strip()
        if pd.notna(assoc_val) and str(assoc_val).strip():
            current_associate = str(assoc_val).strip().lower()

        if not current_associate:
            continue

        key = (current_week, current_associate)
        if key not in specialist_data:
            site = str(row.get('Site', '')) if pd.notna(row.get('Site', '')) else ''
            marketplace = str(row.get('Marketplace', '')) if pd.notna(row.get('Marketplace', '')) else ''
            specialist_data[key] = {
                'week': current_week,
                'login': current_associate,
                'name': member_map[current_associate].name if current_associate in member_map else current_associate,
                'marketplace': marketplace if marketplace != 'NOT AVAILABLE FROM SOURCE' else '',
                'site': site,
                'overall_offered': 0, 'overall_missed': 0,
                'chat_offered': 0, 'chat_missed': 0,
                'voice_offered': 0, 'voice_missed': 0,
                'wi_offered': 0, 'wi_missed': 0,
            }

        def safe_int(v):
            try:
                return int(float(v)) if pd.notna(v) else 0
            except:
                return 0

        specialist_data[key]['overall_offered'] += safe_int(row.get('Overall Offered', 0))
        specialist_data[key]['overall_missed'] += safe_int(row.get('Overall Missed', 0))
        specialist_data[key]['chat_offered'] += safe_int(row.get('Chat Offered', 0))
        specialist_data[key]['chat_missed'] += safe_int(row.get('Chat Missed', 0))
        specialist_data[key]['voice_offered'] += safe_int(row.get('Voice Offered', 0))
        specialist_data[key]['voice_missed'] += safe_int(row.get('Voice Missed', 0))
        specialist_data[key]['wi_offered'] += safe_int(row.get('WI Offered', 0))
        specialist_data[key]['wi_missed'] += safe_int(row.get('WI Missed', 0))

    # Calculate percentages
    result = []
    for d in specialist_data.values():
        d['overall_missed_pct'] = round((d['overall_missed'] / d['overall_offered'] * 100), 2) if d['overall_offered'] > 0 else 0
        d['chat_missed_pct'] = round((d['chat_missed'] / d['chat_offered'] * 100), 2) if d['chat_offered'] > 0 else 0
        d['voice_missed_pct'] = round((d['voice_missed'] / d['voice_offered'] * 100), 2) if d['voice_offered'] > 0 else 0
        d['wi_missed_pct'] = round((d['wi_missed'] / d['wi_offered'] * 100), 2) if d['wi_offered'] > 0 else 0
        d['missed_contact_rate_live'] = d['overall_missed_pct']
        result.append(d)

    result.sort(key=lambda x: (x['week'], -x['overall_missed_pct']))

    # Get week from file's week_label
    week_label = fu.week_label or ''

    return {
        'message': 'Missed contacts processed successfully',
        'week_label': week_label,
        'total_specialists': len(set(d['login'] for d in result)),
        'total_records': len(result),
        'specialist_data': result
    }


def _process_missed_pdf(fu, member_map):
    with pdfplumber.open(fu.file_path) as pdf:
        overview_data = []
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                header = [str(c).strip().lower() if c else '' for c in table[0]]
                if 'associate' in header and 'chat missed' in header:
                    for row in table[1:]:
                        login = str(row[0]).strip().lower() if row[0] else ''
                        if not login:
                            continue
                        chat = int(row[1]) if row[1] and str(row[1]).isdigit() else 0
                        voice = int(row[2]) if row[2] and str(row[2]).isdigit() else 0
                        workitem = int(row[3]) if row[3] and str(row[3]).isdigit() else 0
                        overview_data.append({
                            'login': login,
                            'name': member_map[login].name if login in member_map else login,
                            'chat_missed': chat,
                            'voice_missed': voice,
                            'workitem_missed': workitem,
                            'total_missed': chat + voice + workitem
                        })
                    break
            if overview_data:
                break

    if not overview_data:
        raise HTTPException(status_code=400, detail="Could not find Missed Contact Overview table in PDF")

    return {
        'message': 'Missed contacts processed successfully (PDF)',
        'week_label': fu.week_label or '',
        'total_specialists': len(overview_data),
        'total_records': len(overview_data),
        'specialist_data': sorted(overview_data, key=lambda x: x['total_missed'], reverse=True)
    }


@router.post("/publish-missed/{file_id}")
async def publish_missed_data(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = _get_file_for_user(db, file_id, current_user)
    if not fu:
        raise HTTPException(status_code=404, detail="File not found")

    # Get Missed metric goal
    metric = db.query(MetricGoal).filter(MetricGoal.metric_code == 'Missed', MetricGoal.is_active == True).first()
    if not metric:
        raise HTTPException(status_code=404, detail="Missed metric goal not configured")
    goal = float(metric.goal_value) if metric.goal_value else 2.0

    # Process the file to get specialist data
    team_users = db.query(User).filter(User.team_name == current_user.team_name, User.is_active == True).all()
    member_map = {u.login.lower(): u for u in team_users if u.login}

    is_excel = fu.file_path.endswith('.xlsx') or fu.file_path.endswith('.xls')
    if is_excel:
        processed = _process_missed_excel(fu, member_map)
    else:
        processed = _process_missed_pdf(fu, member_map)

    # Map login -> TeamMember
    team_members = db.query(TeamMember).filter(TeamMember.is_active == True).all()
    tm_map = {tm.employee_id.lower(): tm for tm in team_members if tm.employee_id}
    member_ids = [tm.id for tm in tm_map.values()]

    specialist_data = processed['specialist_data']

    # Group data by week (extract week_number and year from each row's 'week' field)
    weeks_published = {}
    published_count = 0

    for row in specialist_data:
        login = row.get('login', '').lower()
        tm = tm_map.get(login)
        if not tm:
            continue

        # Parse week from row e.g. "2026 Week 16"
        week_field = str(row.get('week', '')).strip()
        wk_match = re.search(r'(\d{4})\s*Week\s*(\d+)', week_field)
        if wk_match:
            row_year = int(wk_match.group(1))
            row_week = int(wk_match.group(2))
        else:
            # Fallback: try from file's week_label
            if fu.week_label:
                m = re.search(r'Week\s+(\d+)\s*-\s*(\d{4})', fu.week_label)
                if m:
                    row_week, row_year = int(m.group(1)), int(m.group(2))
                else:
                    continue
            else:
                continue

        # Delete existing records for this week (only once per week)
        wk_key = (row_year, row_week)
        if wk_key not in weeks_published and member_ids:
            db.query(MemberPerformanceMetric).filter(
                MemberPerformanceMetric.metric_code == 'Missed',
                MemberPerformanceMetric.week_number == row_week,
                MemberPerformanceMetric.year == row_year,
                MemberPerformanceMetric.member_id.in_(member_ids)
            ).delete(synchronize_session=False)
            weeks_published[wk_key] = 0

        # Get missed percentage
        if 'overall_missed_pct' in row:
            missed_pct = float(row['overall_missed_pct'])
        elif 'total_missed' in row:
            missed_pct = float(row['total_missed'])
        else:
            missed_pct = 0.0

        # Score: goal is 2% (lower is better). 0% = 100 score, >=goal*2 = 0 score
        if goal > 0:
            score = max(0, min(100, (1 - missed_pct / (goal * 2)) * 100))
        else:
            score = 100.0 if missed_pct == 0 else 0.0

        raw = {k: v for k, v in row.items() if k != 'name'}

        record = MemberPerformanceMetric(
            member_id=tm.id,
            metric_code='Missed',
            metric_value=missed_pct,
            normalized_score=round(score, 2),
            week_number=row_week,
            year=row_year,
            source_file=fu.original_filename,
            raw_data=raw
        )
        db.add(record)
        published_count += 1
        weeks_published[wk_key] = weeks_published.get(wk_key, 0) + 1

    db.commit()

    weeks_summary = [{'week': wk, 'year': yr, 'count': cnt} for (yr, wk), cnt in sorted(weeks_published.items())]

    return {
        'message': f'Published Missed Contact data for {len(weeks_published)} week(s)',
        'published_count': published_count,
        'weeks_published': weeks_summary,
        'metric_code': 'Missed'
    }


@router.post("/process-missed-deepdive/{file_id}")
async def process_missed_deepdive(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = _get_file_for_user(db, file_id, current_user)
    if not fu:
        raise HTTPException(status_code=404, detail="File not found")
    if not fu.file_path.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files supported")
    if not os.path.exists(fu.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    try:
        team_users = db.query(User).filter(
            User.team_name == current_user.team_name,
            User.is_active == True
        ).all()
        member_map = {u.login.lower(): u.name for u in team_users if u.login}

        with pdfplumber.open(fu.file_path) as pdf:
            deep_dive_rows = []
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    header = [str(c).strip().lower() if c else '' for c in table[0]]
                    if 'week' in header and 'missed timestamp' in header and 'associate' in header:
                        for row in table[1:]:
                            week = str(row[0]).strip() if row[0] else ''
                            timestamp = str(row[1]).strip() if row[1] else ''
                            login = str(row[2]).strip().lower() if row[2] else ''
                            supervisor = str(row[3]).strip() if row[3] else ''
                            site = str(row[4]).strip() if row[4] else ''
                            queue = str(row[5]).strip() if row[5] else ''
                            workitem = str(row[6]).strip() if row[6] else ''
                            if not login:
                                continue
                            # Extract week number from "2026 Week 16"
                            week_no = ''
                            parts = week.split('Week')
                            if len(parts) == 2:
                                week_no = parts[1].strip()
                            deep_dive_rows.append({
                                'week': week,
                                'week_no': week_no,
                                'missed_timestamp': timestamp,
                                'login': login,
                                'name': member_map.get(login, login),
                                'supervisor': supervisor,
                                'site': site,
                                'attribute_queue': queue,
                                'workitem': workitem
                            })
                        break
                if deep_dive_rows:
                    break

        if not deep_dive_rows:
            raise HTTPException(status_code=400, detail="Could not find Work Item Deep Dive table in PDF")

        # Group by specialist
        specialist_summary = {}
        for row in deep_dive_rows:
            key = row['login']
            if key not in specialist_summary:
                specialist_summary[key] = {
                    'login': row['login'],
                    'name': row['name'],
                    'total_incidents': 0,
                    'weeks': set()
                }
            specialist_summary[key]['total_incidents'] += 1
            specialist_summary[key]['weeks'].add(row['week_no'])

        summary = []
        for s in specialist_summary.values():
            summary.append({
                'login': s['login'],
                'name': s['name'],
                'total_incidents': s['total_incidents'],
                'weeks': sorted(list(s['weeks']))
            })
        summary.sort(key=lambda x: x['total_incidents'], reverse=True)

        return {
            'message': 'Deep Dive Missed Contacts processed successfully',
            'total_records': len(deep_dive_rows),
            'total_specialists_impacted': len(summary),
            'specialist_summary': summary,
            'deep_dive_data': deep_dive_rows
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.delete("/delete/{file_id}")
async def delete_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = _get_file_for_user(db, file_id, current_user)
    if not fu:
        raise HTTPException(status_code=404, detail="File not found")
    if os.path.exists(fu.file_path):
        os.remove(fu.file_path)
    db.delete(fu)
    db.commit()
    return {"message": "File deleted"}
