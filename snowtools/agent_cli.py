import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.tools.search import TavilySearchService
from app.services.agent.researcher import ResearchAgent
from app.services.agent.writer import WriterAgent

async def chat_loop():
    print("🤖 ShortPlay Agent: 你好！我是你的短剧创作助手。")
    print("我可以帮你上网搜集最新的热点素材，学习小红书的爆款写法，然后为你生成剧本。")
    print("你可以试着对我说：'看看最近有什么火的题材' 或者 '帮我写一个银发霸总的剧本'。")
    print("------------------------------------------------------------------")

    search_service = TavilySearchService()
    researcher = ResearchAgent()
    writer = WriterAgent()
    
    # 模拟简单的对话状态
    current_trend = None
    current_method = None

    while True:
        user_input = input("\n👤 你: ")
        if user_input.lower() in ["exit", "quit", "退出"]:
            print("🤖 ShortPlay Agent: 拜拜！祝你剧本大卖！")
            break

        if "热点" in user_input or "题材" in user_input:
            print("\n🤖 Agent: 正在全网搜索最新的短剧风口，顺便去小红书看看...")
            results = await search_service.search_trends()
            current_trend = await researcher.analyze_trends(results)
            
            print(f"\n📈 发现热点：【{current_trend.topic}】")
            print(f"💡 灵感来源：{current_trend.summary}")
            print("✨ 推荐切入点：")
            for p in current_trend.inspiration_points:
                print(f"  - {p}")
            print("\n你要基于这个热点创作吗？还是再看看别的？")

        elif "写法" in user_input or "教程" in user_input:
            print("\n🤖 Agent: 正在学习小红书上的爆款剧本教程...")
            results = await search_service.search_writing_methods()
            methods = await researcher.extract_methods(results)
            current_method = methods[0]
            
            print(f"\n📘 学习笔记：【{current_method.method_name}】")
            print(f"📝 核心逻辑：{current_method.core_logic}")
            print(f"📐 结构公式：{current_method.structure_template}")

        elif "生成" in user_input or "写" in user_input:
            if not current_trend:
                # 如果没有上下文，先 mock 一个
                print("🤖 Agent: 你还没确定题材呢，那我先按最近火的 '银发霸总' 来写咯？")
                results = await search_service.search_trends()
                current_trend = await researcher.analyze_trends(results)
            
            if not current_method:
                results = await search_service.search_writing_methods()
                current_method = (await researcher.extract_methods(results))[0]

            print(f"\n🤖 Agent: 好的！正在基于【{current_trend.topic}】题材，运用【{current_method.method_name}】开始创作...")
            script = await writer.write_script(current_trend, current_method)
            
            print("\n" + "="*20 + " 生成结果 " + "="*20)
            print(script)
            print("="*50)
            print("\n📄 剧本已生成！你可以让我'保存为Word'或者'修改一下'。")

        elif "保存" in user_input and "word" in user_input.lower():
            print("\n🤖 Agent: 正在导出为 Word 文档... (Mock: script.docx saved)")
            # 实际逻辑会调用 python-docx
            
        else:
            print("\n🤖 Agent: 抱歉，我还在学习中，目前只支持搜索热点、学习写法和生成剧本哦。")

if __name__ == "__main__":
    asyncio.run(chat_loop())
