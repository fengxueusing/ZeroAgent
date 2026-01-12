import time
from typing import Dict, List

# ---------------------------------------------------------
# SKILL: SCRIPT WORKSHOP (剧本工坊)
# ---------------------------------------------------------

def meta():
    return {
        "name": "script_workshop",
        "description": "生成短剧创意、大纲与剧本。",
        "commands": ["brainstorm", "write_script"]
    }

def brainstorm(topic: str) -> List[str]:
    """
    创意裂变
    """
    print(f"💡 [Workshop] 正在对 '{topic}' 进行创意裂变...")
    time.sleep(1)
    
    ideas = [
        f"【反转流】{topic}：看似是{topic}，其实是针对主角的一场巨大的楚门秀。",
        f"【重生流】{topic}：主角重生回到了{topic}发生的前一天，誓要改变命运。",
        f"【甜宠流】{topic}：霸道总裁为了追求女主，竟然去学习{topic}？",
        f"【悬疑流】{topic}：所有的线索都指向{topic}，但真相却让人毛骨悚然。"
    ]
    return ideas

def write_script(idea: str) -> str:
    """
    撰写剧本 (Mock)
    """
    print(f"✍️ [Workshop] 正在撰写剧本: {idea} ...")
    time.sleep(2)
    
    script_content = f"""
《{idea.split('：')[0]}》

【梗概】
{idea.split('：')[1]}

【人物小传】
主角：李雷，25岁，性格隐忍，实则腹黑。
配角：韩梅梅，24岁，天真烂漫，其实是幕后黑手。

【正文】

第一场：【日】【外】【街道】
（镜头特写：一只手紧紧握着一张照片）
旁白：如果我知道那天会发生什么，我死也不会走出那扇门。
（李雷匆匆走过街道，神色慌张）
李雷：（自言自语）来不及了，还有三分钟。

第二场：【日】【内】【咖啡馆】
（韩梅梅坐在窗边，优雅地搅动咖啡）
（李雷推门而入，风铃声响起）
韩梅梅：（微笑）你迟到了哦。
李雷：（喘气）那件事... 是不是你做的？
韩梅梅：（无辜脸）哪件事呀？你是说... 把你的秘密告诉全世界这件事吗？

（音乐突变，激昂）
（画面定格，出片名）

【本集完】
    """
    return script_content
