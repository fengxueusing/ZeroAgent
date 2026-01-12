from typing import List, Dict
from pydantic import BaseModel, Field

class Persona(BaseModel):
    id: str
    name: str
    description: str
    core_desires: List[str] = Field(description="核心欲望/爽点")
    pain_points: List[str] = Field(description="核心痛点/焦虑")
    language_style: str = Field(description="喜欢的语言风格")
    search_keywords: List[str] = Field(description="该群体关注的搜索词")
    
    # 虚无驱动模块 (Void Engine)
    void_source: str = Field(default="", description="该群体内心深处最大的虚无来源")
    compensatory_mechanism: str = Field(default="", description="他们习惯用什么来代偿这种虚无")
    redemption_arc: str = Field(default="", description="剧本中必须提供的救赎路径")

class PersonaLibrary:
    @staticmethod
    def get_persona(persona_id: str) -> Persona:
        personas = {
            "baoma": Persona(
                id="baoma",
                name="全职宝妈/中年女性",
                description="生活重心在家庭，但也渴望被认可，对婆媳关系、育儿焦虑、丈夫背叛极度敏感。",
                core_desires=["被宠爱", "逆袭打脸", "孩子成才", "经济独立"],
                pain_points=["丧偶式育儿", "婆婆刁难", "身材走样", "老公出轨"],
                language_style="情绪饱满，带一点家长里短的烟火气，或者极致的复仇快感。",
                search_keywords=["婆媳", "二胎", "离婚", "带娃", "全职太太逆袭"],
                
                # Void Update
                void_source="自我价值的消逝。感觉自己只是'谁谁的妈妈'或'谁谁的老婆'，唯独不是自己。",
                compensatory_mechanism="通过看剧中的女主手撕恶婆婆、脚踢渣男，来获得'我依然有力量'的幻觉。",
                redemption_arc="不仅要让女主赢，还要让她在赢的过程中找回丢失的尊严和名字。"
            ),
            "xiaoxiannv": Persona(
                id="xiaoxiannv",
                name="都市年轻女性/小仙女",
                description="向往浪漫爱情，颜控，注重情绪价值，讨厌爹味说教。",
                core_desires=["被坚定选择", "独宠", "高颜值CP", "大女主搞事业"],
                pain_points=["渣男PUA", "催婚", "职场打压", "不仅要赢还要美"],
                language_style="傲娇，毒舌，网感强，发疯文学，拒绝内耗。",
                search_keywords=["甜宠", "高干", "暗恋", "大女主", "手撕绿茶"],
                
                # Void Update
                void_source="原子化社会的孤独与被替代的恐惧。虽然嘴上说独立，但内心渴望一种'非你不可'的链接。",
                compensatory_mechanism="通过看剧中的男主无条件宠溺，来对抗现实中'随时可能被抛弃'的不安全感。",
                redemption_arc="确认'我是被爱的'，且这份爱不需要我委曲求全。"
            ),
            "zhainan": Persona(
                id="zhainan",
                name="都市男性/小镇青年",
                description="生活压力大，渴望力量和认同，喜欢简单直接的爽感。",
                core_desires=["扮猪吃虎", "校花倒追", "兄弟义气", "一夜暴富"],
                pain_points=["被看不起", "没钱", "女神高冷", "上司压榨"],
                language_style="热血，直接，不墨迹，带点中二魂。",
                search_keywords=["战神", "赘婿", "透视", "神豪", "校花"],
                
                # Void Update
                void_source="平庸的窒息感。日复一日的螺丝钉生活，感觉自己这辈子也就这样了。",
                compensatory_mechanism="通过看剧中的主角一夜成神，来体验'我其实命不该绝'的可能性。",
                redemption_arc="证明'莫欺少年穷'，让所有看不起我的人跪下忏悔。"
            )
        }
        return personas.get(persona_id, personas["baoma"]) # 默认宝妈
