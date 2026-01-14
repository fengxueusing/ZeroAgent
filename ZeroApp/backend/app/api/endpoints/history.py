from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
import os
import glob
import time
import shutil
from typing import List, Optional, Literal, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body, Path
from pydantic import BaseModel
from app.services.history_service import history_service, Conversation

router = APIRouter()

# --- Conversations API ---

@router.get("/conversations", response_model=List[Dict])
async def list_conversations():
    return await history_service.list_conversations()

@router.get("/search", response_model=List[Dict])
async def search_conversations(q: str = Query(..., min_length=1), limit: int = 20):
    """
    Search for messages containing the query string across all conversations.
    """
    return await history_service.search_conversations(q, limit)

@router.post("/conversations", response_model=Conversation)
async def create_conversation(title: str = Body("New Chat", embed=True)):
    return await history_service.create_conversation(title)

@router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str = Path(...)):
    conv = await history_service.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str = Path(...)):
    await history_service.delete_conversation(conversation_id)
    return {"status": "success"}

@router.patch("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: str = Path(...),
    title: str = Body(..., embed=True)
):
    try:
        return await history_service.update_title(conversation_id, title)
    except ValueError:
        raise HTTPException(status_code=404, detail="Conversation not found")

# --- Drafts API (Existing) ---

DRAFTS_DIR = "data/drafts"
if not os.path.exists(DRAFTS_DIR):
    os.makedirs(DRAFTS_DIR)

class Draft(BaseModel):
    filename: str # Now represents full relative path
    content: str
    updated_at: Optional[float] = None

class FileSystemItem(BaseModel):
    name: str
    path: str # Relative path from DRAFTS_DIR
    type: Literal["file", "folder"]
    updated_at: float
    size: int
    preview: Optional[str] = None

class CreateFolderRequest(BaseModel):
    path: str # Relative path for new folder

class MoveItemRequest(BaseModel):
    source: str # Relative path
    destination: str # Relative path

@router.get("/drafts", response_model=List[FileSystemItem])
async def list_drafts(path: str = Query("", description="Relative path to list")):
    """
    List files and folders in the drafts directory or subdirectory.
    """
    # Security check
    target_dir = os.path.join(DRAFTS_DIR, path)
    if not os.path.abspath(target_dir).startswith(os.path.abspath(DRAFTS_DIR)):
         raise HTTPException(status_code=400, detail="Invalid path")
    
    if not os.path.exists(target_dir):
         # If path doesn't exist, return empty list or 404? 
         # Let's return empty list but log warning, or 404 if user explicitly requested deep path
         if path:
             raise HTTPException(status_code=404, detail="Directory not found")
         return []

    items = []
    try:
        with os.scandir(target_dir) as entries:
            for entry in entries:
                # Calculate relative path
                rel_path = os.path.relpath(entry.path, DRAFTS_DIR).replace("\\", "/")
                
                if entry.is_dir():
                    items.append(FileSystemItem(
                        name=entry.name,
                        path=rel_path,
                        type="folder",
                        updated_at=entry.stat().st_mtime,
                        size=0 # Directories don't have size in this context
                    ))
                elif entry.is_file() and entry.name.endswith(('.md', '.txt')):
                    # Read preview
                    preview = ""
                    try:
                        with open(entry.path, 'r', encoding='utf-8') as f:
                            content = f.read(100)
                            preview = content.strip() + "..." if len(content) >= 100 else content.strip()
                    except:
                        pass
                        
                    items.append(FileSystemItem(
                        name=entry.name,
                        path=rel_path,
                        type="file",
                        updated_at=entry.stat().st_mtime,
                        size=entry.stat().st_size,
                        preview=preview
                    ))
    except Exception as e:
        print(f"Error scanning directory {target_dir}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
    # Sort: Folders first, then by updated_at desc
    items.sort(key=lambda x: (x.type != 'folder', -x.updated_at))
    return items

@router.post("/folders")
async def create_folder(request: CreateFolderRequest):
    """
    Create a new folder.
    """
    target_path = os.path.join(DRAFTS_DIR, request.path)
    
    # Security check
    if not os.path.abspath(target_path).startswith(os.path.abspath(DRAFTS_DIR)):
         raise HTTPException(status_code=400, detail="Invalid path")
         
    if os.path.exists(target_path):
        raise HTTPException(status_code=409, detail="Folder already exists")
        
    try:
        os.makedirs(target_path)
        return {"status": "success", "path": request.path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/move")
async def move_item(request: MoveItemRequest):
    """
    Move or rename a file/folder.
    """
    src_path = os.path.join(DRAFTS_DIR, request.source)
    dest_path = os.path.join(DRAFTS_DIR, request.destination)
    
    # Security check
    if not os.path.abspath(src_path).startswith(os.path.abspath(DRAFTS_DIR)) or \
       not os.path.abspath(dest_path).startswith(os.path.abspath(DRAFTS_DIR)):
         raise HTTPException(status_code=400, detail="Invalid path")
         
    if not os.path.exists(src_path):
        raise HTTPException(status_code=404, detail="Source not found")
        
    if os.path.exists(dest_path):
        raise HTTPException(status_code=409, detail="Destination already exists")
        
    try:
        # Ensure destination directory exists
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.move(src_path, dest_path)
        return {"status": "success", "from": request.source, "to": request.destination}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/drafts/{filename:path}") # :path allows slashes
async def get_draft(filename: str):
    """
    Get the full content of a draft.
    """
    file_path = os.path.join(DRAFTS_DIR, filename)
    
    # Security check: prevent directory traversal
    if not os.path.abspath(file_path).startswith(os.path.abspath(DRAFTS_DIR)):
         raise HTTPException(status_code=400, detail="Invalid filename")
         
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Draft not found")
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return Draft(
            filename=filename,
            content=content,
            updated_at=os.path.getmtime(file_path)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/drafts/{filename:path}")
async def delete_draft(filename: str):
    """
    Delete a draft or folder.
    """
    file_path = os.path.join(DRAFTS_DIR, filename)
    
    if not os.path.abspath(file_path).startswith(os.path.abspath(DRAFTS_DIR)):
         raise HTTPException(status_code=400, detail="Invalid filename")
         
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Not found")
        
    try:
        if os.path.isdir(file_path):
            shutil.rmtree(file_path) # Recursive delete
        else:
            os.remove(file_path)
        return {"status": "success", "deleted": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/drafts")
async def save_draft(draft: Draft):
    """
    Save or update a draft. Creates directories if needed.
    """
    # Sanitize filename/path
    filename = draft.filename
    if not filename:
        filename = f"draft_{int(time.time())}.md"
    if not filename.endswith(('.md', '.txt')):
        filename += ".md"
        
    file_path = os.path.join(DRAFTS_DIR, filename)
    
    # Security Check
    if not os.path.abspath(file_path).startswith(os.path.abspath(DRAFTS_DIR)):
        raise HTTPException(status_code=400, detail="Invalid path")

    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(draft.content)
            
        return {
            "status": "success",
            "filename": filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
