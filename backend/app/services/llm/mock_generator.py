from app.services.base import BaseScriptGenerator
from app.models.story import Script, Scene

class MockScriptGenerator(BaseScriptGenerator):
    async def generate_script(self, topic: str, **kwargs) -> Script:
        # 这是一个模拟实现，用于测试框架流程
        return Script(
            title=f"关于 {topic} 的故事",
            theme="悬疑/反转",
            scenes=[
                Scene(
                    id=1,
                    description="夜晚，街道空无一人，只有一盏路灯忽明忽暗。",
                    narration="从来没有人告诉过我，午夜十二点后的街道会是这个样子。",
                    image_prompt="dark street at night, flickering street light, cinematic lighting, 8k",
                    duration=5.0
                ),
                Scene(
                    id=2,
                    description="主角回头，发现地上多了一个影子。",
                    narration="直到我听到了那个声音...",
                    dialogue="谁在那里？",
                    image_prompt="character looking back, mysterious shadow on ground, suspense atmosphere",
                    duration=4.0
                )
            ]
        )

    async def refine_script(self, script: Script) -> Script:
        return script
