from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    source: str = "web"  # web, xiaohongshu, etc.

class TrendReport(BaseModel):
    topic: str
    keywords: List[str]
    summary: str
    inspiration_points: List[str] = Field(description="Points of inspiration extracted from trends")

class WritingMethod(BaseModel):
    method_name: str
    core_logic: str
    structure_template: str = Field(description="Script structure template for this method")

class AgentState(BaseModel):
    """Agent Runtime State"""
    chat_history: List[Dict[str, str]] = []
    current_trend: Optional[TrendReport] = None
    learned_methods: List[WritingMethod] = []
    draft_script: Optional[str] = None

class ScriptRefinementRequest(BaseModel):
    script: str
    instruction: str = Field(description="User instruction for refinement, e.g., 'make it funnier'")

class SaveDraftRequest(BaseModel):
    filename: str
    content: str
