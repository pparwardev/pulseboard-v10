"""File Manager API for PulseBoard V10."""
import os, shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.file_upload import FileUpload

router = APIRouter(prefix="/api/file-manager", tags=["File Manager"])
UPLOAD_DIR = "uploads/file_manager"
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
    return {"id": fu.id, "name": fu.original_filename, "size": fu.file_size, "type": fu.file_type, "uploaded_at": fu.uploaded_at.isoformat(), "week_label": fu.week_label, "url": f"/api/file-manager/download/{fu.id}"}


@router.get("/files")
async def get_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    files = db.query(FileUpload).filter(FileUpload.user_id == current_user.id).order_by(FileUpload.uploaded_at.desc()).all()
    return [{"id": f.id, "name": f.original_filename, "size": f.file_size, "type": f.file_type, "metric_code": f.metric_code, "week_label": f.week_label, "uploaded_at": f.uploaded_at.isoformat(), "url": f"/api/file-manager/download/{f.id}"} for f in files]


@router.get("/download/{file_id}")
async def download_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = db.query(FileUpload).filter(FileUpload.id == file_id).first()
    if not fu or not os.path.exists(fu.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fu.file_path, filename=fu.original_filename, media_type=fu.file_type)


@router.delete("/delete/{file_id}")
async def delete_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fu = db.query(FileUpload).filter(FileUpload.id == file_id, FileUpload.user_id == current_user.id).first()
    if not fu:
        raise HTTPException(status_code=404, detail="File not found")
    if os.path.exists(fu.file_path):
        os.remove(fu.file_path)
    db.delete(fu)
    db.commit()
    return {"message": "File deleted"}
