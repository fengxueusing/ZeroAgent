from fastapi import APIRouter, Depends, Body
from typing import List
from app.core.void_engine import VoidEngine
from app.api.deps import get_engine
from app.services.agent.researcher import ResearchAgent
from app.services.agent.writer import WriterAgent
from app.services.file_manager import FileManager
from app.models.agent import TrendReport, WritingMethod, SearchResult, ScriptRefinementRequest, SaveDraftRequest

router = APIRouter()
researcher = ResearchAgent()
writer = WriterAgent()
file_manager = FileManager()

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
