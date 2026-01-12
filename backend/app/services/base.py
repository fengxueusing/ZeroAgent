from abc import ABC, abstractmethod
from app.models.story import Script, Scene

class BaseScriptGenerator(ABC):
    @abstractmethod
    async def generate_script(self, topic: str, **kwargs) -> Script:
        """根据主题生成剧本"""
        pass

    @abstractmethod
    async def refine_script(self, script: Script) -> Script:
        """优化剧本"""
        pass

class BaseImageGenerator(ABC):
    @abstractmethod
    async def generate_image(self, prompt: str, output_path: str, **kwargs) -> str:
        """根据提示词生成图片，返回文件路径"""
        pass

class BaseAudioGenerator(ABC):
    @abstractmethod
    async def generate_speech(self, text: str, voice: str, output_path: str, **kwargs) -> str:
        """生成语音，返回文件路径"""
        pass

class BaseVideoComposer(ABC):
    @abstractmethod
    async def compose_video(self, script: Script, output_path: str, **kwargs) -> str:
        """合成视频，返回文件路径"""
        pass
