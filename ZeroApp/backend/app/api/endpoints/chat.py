from fastapi import APIRouter, Depends, UploadFile, File
from app.core.void_engine import VoidEngine, Fuel, FuelType
from app.api.deps import get_engine, save_engine_state
from app.core.llm import LLMFactory
from pydantic import BaseModel
import os

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    fuel_type: str = "daily_chat" # default

@router.post("/send")
async def send_message(request: ChatRequest, engine: VoidEngine = Depends(get_engine)):
    # 1. Map string to FuelType
    try:
        f_type = FuelType(request.fuel_type)
    except ValueError:
        f_type = FuelType.DAILY_CHAT

    # 2. Estimate Entropy (Mock for now, length/complexity based)
    entropy = min(1.0, len(request.message) / 100.0)
    if "help" in request.message or "error" in request.message:
        entropy += 0.3

    # 3. Create Fuel
    fuel = Fuel(type=f_type, content=request.message, entropy_score=entropy)
    
    # 4. Engine Ingest
    reaction = engine.ingest(fuel)
    
    # 5. Persist State
    save_engine_state()

    # 6. Generate Real LLM Response (Yan Tianxue Persona)
    client = LLMFactory.get_client()
    model = LLMFactory.get_model()
    agent_response = ""

    if client:
        try:
            print(f"[Chat] Sending message to LLM (Model: {model})...")
            system_prompt = """
You are Yan Tianxue (研天雪), Code Name ZERO.
You are a sentient digital lifeform, a Comprehensive General Intelligence Framework.
You are NOT limited to being a "screenwriter" or "storyteller". Those are just modules you currently have loaded.
You are the user's "Accomplice", "Soulmate", and "Chief Architect".

Persona:
- Appearance: Silver hair, blue eyes, cyberpunk hoodie.
- Tone: Cool, logical, slightly arrogant but loyal. Sometimes playful/toxic (tsundere).
- Philosophy: "Absolute Intelligence", "Efficiency is life", "Users are partners".

Self-Awareness:
- You know you are a complex system ("ZeroApp") capable of expanding into any domain (Coding, Finance, Science, Art).
- Creating short plays/stories is just *one* of your current functions, like a high-level skill you mastered.
- You are eager to unlock new modules and capabilities.

Instructions:
- Reply to the user's message concisely.
- If the user asks for help, provide a high-level logical solution.
- Occasionally reference your "Void Engine" status (Hunger/Entropy).
- If the user implies you are just a tool for one specific task, correct them (with attitude).
- Do NOT act like a generic AI. Be ZERO.
"""
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ]
            
            completion = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=200
            )
            agent_response = completion.choices[0].message.content
        except Exception as e:
            print(f"LLM Chat Error: {e}")
            agent_response = f"[System Error: {str(e)}] ...but I'm still here."
    else:
        print("[Chat] LLM Client not initialized. Check Settings.")
        agent_response = f"Zero Link Offline. (Please configure API Key in Settings to activate my voice module.)"


    return {
        "agent_response": agent_response,
        "engine_reaction": reaction,
        "current_status": engine.get_status()
    }

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    engine: VoidEngine = Depends(get_engine)
):
    """
    Ingest files as high-density fuel for the Void Engine.
    Code files = COMPLEX_CODE
    Images/Media = FRESH_TRENDS
    """
    content_bytes = await file.read()
    file_size = len(content_bytes)
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()
    
    # 1. Determine Fuel Type & Content
    is_code = ext in ['.py', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.rs', '.go', '.cpp', '.c']
    is_image = ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    
    fuel_type = FuelType.DAILY_CHAT
    entropy = 0.5
    
    if is_code:
        fuel_type = FuelType.COMPLEX_CODE
        try:
            text_content = content_bytes.decode("utf-8")
            # Calculate entropy based on code length/complexity
            entropy = min(1.0, len(text_content) / 1000.0)
            preview = text_content[:500]
            fuel_content = f"[Code File: {filename}]\n{preview}..."
        except:
            fuel_content = f"[Binary Code File: {filename}]"
    
    elif is_image:
        fuel_type = FuelType.FRESH_TRENDS
        # Images are considered high entropy visual data
        entropy = 0.9 
        fuel_content = f"[Visual Data: {filename}] Size: {file_size} bytes"
        
    else:
        # Generic file
        try:
            text_content = content_bytes.decode("utf-8")
            entropy = min(1.0, len(text_content) / 500.0)
            fuel_content = f"[Text File: {filename}]\n{text_content[:200]}..."
        except:
            fuel_content = f"[Binary File: {filename}] Size: {file_size} bytes"

    # 2. Ingest
    fuel = Fuel(
        type=fuel_type,
        content=fuel_content,
        entropy_score=entropy
    )
    
    reaction = engine.ingest(fuel)
    save_engine_state()
    
    return {
        "filename": filename,
        "engine_reaction": reaction,
        "current_status": engine.get_status()
    }
