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
    inspiration_points: List[str] = Field(description="从热点中提取的创作灵感")

class WritingMethod(BaseModel):
    method_name: str
    core_logic: str
    structure_template: str = Field(description="该方法对应的剧本结构模板")

class AgentState(BaseModel):
    """Agent 的运行状态"""
    chat_history: List[Dict[str, str]] = []
    current_trend: Optional[TrendReport] = None
    learned_methods: List[WritingMethod] = []
    draft_script: Optional[str] = None
