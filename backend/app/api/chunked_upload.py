"""Chunked file upload for large files to bypass CloudFront limits."""
import os
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.file_upload import FileUpload
from datetime import datetime

router = APIRouter(prefix="/api/chunked-upload", tags=["Chunked Upload"])
UPLOAD_DIR = "uploads/file_manager"
TEMP_DIR = "uploads/temp"
os.makedirs(TEMP_DIR, exist_ok=True)

class ChunkUploadRequest(BaseModel):
    chunk_data: str  # base64
    chunk_index: int
    total_chunks: int
    file_id: str  # unique identifier for this upload session
    filename: Optional[str] = None
    file_size: Optional[int] = None

@router.post("/chunk")
async def upload_chunk(req: ChunkUploadRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Upload a single chunk of a file."""
    import base64
    
    # Validate chunk
    if req.chunk_index >= req.total_chunks or req.chunk_index < 0:
        raise HTTPException(status_code=400, detail="Invalid chunk index")
    
    try:
        chunk_data = base64.b64decode(req.chunk_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 data")
    
    # Store chunk temporarily
    temp_file = os.path.join(TEMP_DIR, f"{req.file_id}_{req.chunk_index}")
    with open(temp_file, "wb") as f:
        f.write(chunk_data)
    
    return {"message": f"Chunk {req.chunk_index + 1}/{req.total_chunks} uploaded"}

@router.post("/complete")
async def complete_upload(file_id: str, filename: str, metric_code: str = None, week_label: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Combine all chunks into final file."""
    from werkzeug.utils import secure_filename
    
    # Find all chunks
    chunk_files = []
    chunk_index = 0
    while True:
        chunk_file = os.path.join(TEMP_DIR, f"{file_id}_{chunk_index}")
        if not os.path.exists(chunk_file):
            break
        chunk_files.append(chunk_file)
        chunk_index += 1
    
    if not chunk_files:
        raise HTTPException(status_code=404, detail="No chunks found")
    
    # Validate filename
    safe_filename = secure_filename(filename)
    if not safe_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    # Combine chunks
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = f"{metric_code}_" if metric_code else ""
    stored_name = f"{current_user.id}_{prefix}{timestamp}_{safe_filename}"
    final_path = os.path.join(UPLOAD_DIR, stored_name)
    
    total_size = 0
    with open(final_path, "wb") as final_file:
        for chunk_file in chunk_files:
            with open(chunk_file, "rb") as cf:
                data = cf.read()
                final_file.write(data)
                total_size += len(data)
            os.remove(chunk_file)  # Clean up
    
    # Save to database
    fu = FileUpload(
        user_id=current_user.id,
        filename=stored_name,
        original_filename=safe_filename,
        file_path=final_path,
        file_size=total_size,
        file_type="application/octet-stream",
        metric_code=metric_code,
        week_label=week_label
    )
    db.add(fu)
    db.commit()
    db.refresh(fu)
    
    return {
        "id": fu.id,
        "name": fu.original_filename,
        "size": fu.file_size,
        "message": "File uploaded successfully"
    }