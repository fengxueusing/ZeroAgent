from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.void_engine import VoidEngine, Fuel, FuelType
from app.api.deps import get_engine, save_engine_state
import shutil
import os

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    engine: VoidEngine = Depends(get_engine)
):
    try:
        # 1. Save File Locally
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Extract Content (Mock for now - simply use filename and size)
        # In real scenario: use OCR for images, Text extraction for PDF/Docx
        file_size = os.path.getsize(file_path)
        content_preview = f"[File Uploaded] Name: {file.filename}, Size: {file_size} bytes, Type: {file.content_type}"
        
        # 3. Calculate Entropy
        # Large files or images are considered "high entropy" potential
        entropy = min(1.0, file_size / 100000.0) 
        
        # 4. Ingest into Engine
        fuel = Fuel(
            type=FuelType.COMPLEX_CODE if "code" in file.content_type or ".py" in file.filename else FuelType.FRESH_TRENDS,
            content=content_preview,
            entropy_score=entropy
        )
        
        reaction = engine.ingest(fuel)
        save_engine_state()
        
        return {
            "filename": file.filename,
            "message": "File ingested successfully.",
            "engine_reaction": reaction,
            "current_status": engine.get_status()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
