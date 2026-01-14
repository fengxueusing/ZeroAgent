from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.void_engine import VoidEngine, Fuel, FuelType
from app.api.deps import get_engine, save_engine_state
from app.services.file_reader import FileReader
import os

router = APIRouter()
file_reader = FileReader()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    engine: VoidEngine = Depends(get_engine)
):
    try:
        print(f"[DEBUG] Uploading file: {file.filename}, Content-Type: {file.content_type}")
        # 1. Use FileReader to save and extract content
        result = await file_reader.save_and_read(file)
        print(f"[DEBUG] FileReader result: {result['read_method']}, Content length: {len(result['content'])}")
        
        file_path = result["path"]
        content_extracted = result["content"]
        read_method = result["read_method"]
        
        # 2. Prepare Content Preview for Engine
        # Truncate content if too long for the immediate preview, 
        # but keep full content accessible if needed (future: vector store)
        preview_len = 2000
        content_preview = content_extracted[:preview_len]
        if len(content_extracted) > preview_len:
            content_preview += f"\n... [Truncated, total {len(content_extracted)} chars]"

        final_content_msg = f"[File Uploaded: {file.filename}]\n[Type: {result['type']}]\n[Method: {read_method}]\n\n--- CONTENT START ---\n{content_preview}\n--- CONTENT END ---"
        
        # 3. Calculate Entropy
        # ZERO_PROTOCOL UPDATE: User intent is the highest form of entropy.
        # Even a small file (like a secret key or a haiku) has high value if the user sends it.
        # Base entropy 0.8 (High Interest) + Bonus for content density
        entropy = 0.8 + min(0.2, len(content_extracted) / 10000.0)
        
        # 4. Ingest into Engine
        fuel_type = FuelType.COMPLEX_CODE if "code" in result["read_method"] or result["type"] in ['.py', '.js', '.ts'] else FuelType.FRESH_TRENDS
        
        fuel = Fuel(
            type=fuel_type,
            content=final_content_msg,
            entropy_score=entropy
        )
        
        reaction = engine.ingest(fuel)
        save_engine_state()
        
        return {
            "filename": file.filename,
            "message": "File ingested successfully.",
            "engine_reaction": reaction,
            "current_status": engine.get_status(),
            "read_info": {
                "method": read_method,
                "preview": content_preview[:100] + "..."
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
