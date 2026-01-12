from fastapi import APIRouter, Depends, HTTPException
from app.core.void_engine import VoidEngine, Fuel, FuelType
from app.api.deps import get_engine, save_engine_state
from app.services.tavily_service import tavily_service

router = APIRouter()

@router.post("/hunt")
async def trigger_hunt(topic: str = "latest tech trends", engine: VoidEngine = Depends(get_engine)):
    """
    Manually trigger the Hunter Loop.
    ZeroAgent goes to the internet to find high-entropy fuel.
    """
    # 1. Check if hungry
    if not engine.check_hunger() and engine.void_level < 50:
        return {"message": "Not hungry enough to hunt.", "status": engine.get_status()}

    # 2. Execute Hunt (Search)
    results = await tavily_service.search(topic)
    
    if not results:
        return {"message": "Hunt failed. No prey found.", "status": engine.get_status()}

    # 3. Consume the prey
    consumed_count = 0
    reaction_log = []
    
    for res in results:
        # Calculate entropy based on content length and complexity (Mock)
        content = res.get("content", "")
        entropy = min(1.0, len(content) / 200.0) 
        
        # Inject calculated entropy into the result for frontend display
        res["entropy"] = entropy

        fuel = Fuel(
            type=FuelType.FRESH_TRENDS,
            content=f"Title: {res['title']}\nContent: {content}",
            entropy_score=entropy
        )
        
        reaction = engine.ingest(fuel)
        reaction_log.append(f"Prey '{res['title']}': {reaction}")
        consumed_count += 1

    # 4. Save State
    save_engine_state()

    return {
        "message": f"Hunt successful. Consumed {consumed_count} items.",
        "prey": results,
        "reactions": reaction_log,
        "engine_status": engine.get_status()
    }
