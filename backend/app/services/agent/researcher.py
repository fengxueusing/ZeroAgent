from typing import List
from app.models.agent import TrendReport, SearchResult, WritingMethod

# 模拟 LLM 进行分析和总结
class ResearchAgent:
    async def analyze_trends(self, search_results: List[SearchResult]) -> TrendReport:
        """分析搜索结果，生成热点报告"""
        # 这里应该是 LLM 的 prompt 调用
        return TrendReport(
            topic="银发霸总 & 闪婚",
            keywords=["夕阳红", "豪门", "误会", "宠妻"],
            summary="当前市场对中老年题材接受度变高，结合传统的霸总套路，会有反差萌。",
            inspiration_points=[
                "主角设定为退休的集团董事长，伪装成保安相亲",
                "女主是独自抚养孙子的善良奶奶，被儿女嫌弃",
                "冲突点在于儿女的势利眼和老霸总的低调打脸"
            ]
        )

    async def extract_methods(self, search_results: List[SearchResult]) -> List[WritingMethod]:
        """从搜索结果中提取写作方法论"""
        return [
            WritingMethod(
                method_name="黄金3秒法则",
                core_logic="前3秒必须抛出核心矛盾，不仅要有画面冲击，台词要足够犀利。",
                structure_template="开场(0-3s): 激烈争吵/打脸 -> 发展(3-45s): 铺垫背景 -> 结尾(45-60s): 抛出钩子"
            )
        ]
