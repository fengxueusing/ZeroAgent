from pydantic import BaseModel
from typing import List, Optional

class Scene(BaseModel):
    id: int
    description: str  # 场景描述
    dialogue: Optional[str] = None # 对白
    narration: Optional[str] = None # 旁白
    image_prompt: str # 用于生成的提示词
    image_path: Optional[str] = None # 生成后的图片路径
    audio_path: Optional[str] = None # 生成后的音频路径
    duration: Optional[float] = None # 预估或实际时长

class Script(BaseModel):
    title: str
    scenes: List[Scene]
    theme: Optional[str] = None
    characters: Optional[List[str]] = None
