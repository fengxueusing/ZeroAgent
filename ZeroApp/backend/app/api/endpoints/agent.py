from fastapi import APIRouter, Depends, Body
from typing import List
from app.core.void_engine import VoidEngine
from app.api.deps import get_engine
from app.services.agent.researcher import ResearchAgent
from app.services.agent.writer import WriterAgent
from app.services.agent.zero_agent import ZeroAgent
from app.services.file_manager import FileManager
from app.services.history_service import history_service
from app.models.agent import TrendReport, WritingMethod, SearchResult, ScriptRefinementRequest, SaveDraftRequest, ChatRequest, ChatResponse

router = APIRouter()
researcher = ResearchAgent()
writer = WriterAgent()
zero_agent = ZeroAgent()
file_manager = FileManager()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    engine: VoidEngine = Depends(get_engine)
):
    """
    General purpose chat endpoint with MCP tool support.
    """
    # Convert Pydantic models to dicts for the agent
    input_messages = [m.model_dump(exclude_none=True) for m in request.messages]
    
    if request.conversation_id:
        # Stateful Mode
        conversation = await history_service.get_conversation(request.conversation_id)
        if not conversation:
             # Fallback or Error? Let's just create one? No, ID provided means it should exist.
             # But maybe frontend generated ID? Let's assume ID must exist.
             # Actually, if not found, treat as stateless? No, that's confusing.
             # Let's assume valid ID.
             pass
        
        if conversation:
            # Append new messages to history
            for msg in input_messages:
                await history_service.add_message(request.conversation_id, msg)
            
            # Use full history for context
            full_history = conversation.messages + input_messages # Wait, I just added them.
            # conversation.messages already has them if I re-read or if add_message updates in-place?
            # add_message updates the file. I should re-read or use the returned object.
            # history_service.add_message returns updated conversation.
            
            # Optimization: just use the object returned by add_message
            # But I'm adding a list.
            
            # Let's reload or just manually append for context.
            # Actually, `add_message` is async and does I/O.
            # Better:
            # 1. Load conversation.
            # 2. Append new messages to `conversation.messages` object.
            # 3. Save once.
            
            # Refactor logic to be efficient? 
            # For now, let's just loop add_message (safe but slow).
            # Or better: history_service doesn't have batch add yet.
            
            # Let's just use what I have.
            # Note: input_messages are ALREADY added to conversation by the loop above?
            # No, I need to capture the updated conversation.
            
            current_conversation = conversation
            for msg in input_messages:
                current_conversation = await history_service.add_message(request.conversation_id, msg)
            
            # Now run agent with full history
            response = await zero_agent.chat(current_conversation.messages)
            
            if response.messages:
                # Update history with the full trace returned by agent
                # Filter out system messages to allow dynamic system prompt updates
                clean_messages = [m for m in response.messages if m.get("role") != "system"]
                
                await history_service.update_conversation_messages(request.conversation_id, clean_messages)

    # Stateless Mode (Default)
    if not request.conversation_id:
        response = await zero_agent.chat(input_messages)
    
    return response

@router.get("/status")
async def get_agent_status(engine: VoidEngine = Depends(get_engine)):
    status = engine.get_status()
    hunger_check = engine.check_hunger()
    
    return {
        "status": status,
        "is_hunting": hunger_check,
        "message": "I am starving..." if hunger_check else "Systems Nominal."
    }

@router.post("/analyze", response_model=TrendReport)
async def analyze_trends(
    results: List[SearchResult], 
    engine: VoidEngine = Depends(get_engine)
):
    """
    Step 1: Analyze raw search results (Prey) to generate a Trend Report.
    """
    report = await researcher.analyze_trends(results)
    return report

@router.post("/learn", response_model=List[WritingMethod])
async def learn_methods(
    results: List[SearchResult], 
    engine: VoidEngine = Depends(get_engine)
):
    """
    Step 2: Extract writing methodologies from search results.
    """
    methods = await researcher.extract_methods(results)
    return methods

@router.post("/write")
async def write_script(
    trend: TrendReport = Body(...),
    method: WritingMethod = Body(...),
    engine: VoidEngine = Depends(get_engine)
):
    """
    Step 3: Generate a script based on Trend Report and Methodology.
    """
    script = await writer.write_script(trend, method)
    return {"script": script}

@router.post("/refine")
async def refine_script(
    request: ScriptRefinementRequest = Body(...),
    engine: VoidEngine = Depends(get_engine)
):
    """
    Step 4: Refine the script based on user instruction.
    """
    refined_script = await writer.refine_script(request.script, request.instruction)
    return {"script": refined_script}

@router.post("/save")
async def save_draft(
    request: SaveDraftRequest = Body(...),
    engine: VoidEngine = Depends(get_engine)
):
    """
    Step 5: Save the script to local filesystem.
    """
    path = await file_manager.save_script(request.filename, request.content)
    return {"status": "saved", "path": path}

@router.get("/drafts")
async def list_drafts(engine: VoidEngine = Depends(get_engine)):
    """
    List all saved drafts.
    """
    drafts = await file_manager.list_drafts()
    return drafts

@router.get("/drafts/{filename}")
async def get_draft(filename: str, engine: VoidEngine = Depends(get_engine)):
    """
    Get content of a specific draft.
    """
    try:
        content = await file_manager.read_draft(filename)
        return {"filename": filename, "content": content}
    except FileNotFoundError:
        return {"error": "Draft not found"}
