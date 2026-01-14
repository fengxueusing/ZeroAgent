from fastapi import APIRouter, Body, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
import shutil
import os

router = APIRouter()

class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None
    llm_key: Optional[str] = None
    llm_base_url: Optional[str] = None
    llm_model: Optional[str] = None
    tavily_key: Optional[str] = None
    github_token: Optional[str] = None
    agent_bio: Optional[str] = None

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    """
    Upload and save user avatar
    """
    try:
        # Validate file type (basic)
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
            
        file_location = "data/uploads/avatar.png"
        
        # Save file
        with open(file_location, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"status": "success", "url": "/static/avatar.png"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_settings():
    """
    Get current settings (Masked for security)
    """
    def mask_key(key: str):
        if not key or len(key) < 8:
            return ""
        return f"{key[:3]}...{key[-4:]}"

    return {
        "llm_provider": settings.LLM_PROVIDER,
        "llm_key": mask_key(settings.LLM_API_KEY),
        "llm_base_url": settings.LLM_BASE_URL,
        "llm_model": settings.LLM_MODEL,
        "tavily_key": mask_key(settings.TAVILY_API_KEY),
        "github_token": mask_key(settings.GITHUB_TOKEN),
        "llm_configured": bool(settings.LLM_API_KEY),
        "tavily_configured": bool(settings.TAVILY_API_KEY),
        "github_configured": bool(settings.GITHUB_TOKEN),
        "agent_bio": settings.AGENT_BIO
    }

@router.post("/")
async def update_settings(data: SettingsUpdate = Body(...)):
    """
    Update settings and save to disk
    """
    settings.save_user_settings(
        llm_provider=data.llm_provider,
        llm_key=data.llm_key,
        llm_base_url=data.llm_base_url,
        llm_model=data.llm_model,
        tavily_key=data.tavily_key,
        github_token=data.github_token,
        agent_bio=data.agent_bio
    )
    return {"status": "updated", "message": "Settings saved successfully"}

@router.post("/test-llm")
async def test_llm_connection(data: SettingsUpdate = Body(...)):
    """
    Test LLM connection with provided credentials (without saving)
    """
    from openai import AsyncOpenAI
    
    try:
        # Use provided credentials or fallback to settings
        api_key = data.llm_key or settings.LLM_API_KEY
        base_url = data.llm_base_url or settings.LLM_BASE_URL
        model = data.llm_model or settings.LLM_MODEL
        
        if not api_key:
             return {"status": "error", "message": "No API Key provided"}

        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Hello, are you online? Reply with 'Online'."}],
            max_tokens=10
        )
        
        reply = response.choices[0].message.content
        return {"status": "success", "message": f"Connection Successful. Model replied: {reply}"}
        
    except Exception as e:
        return {"status": "error", "message": f"Connection Failed: {str(e)}"}
