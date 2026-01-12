import os
from typing import List
from app.models.agent import SearchResult

class TavilySearchService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("TAVILY_API_KEY")
        
    async def search_trends(self, query: str = "最新短剧热点 爆款题材") -> List[SearchResult]:
        """搜索最新的短剧热点"""
        # Mock 实现
        return [
            SearchResult(
                title="2024短剧新风口：'银发经济'题材爆火，老年霸总受追捧",
                url="http://mock-news.com/1",
                content="近期《闪婚老伴是豪门》等中老年题材短剧爆火，打破了年轻人垄断的局面...",
                source="industry_report"
            ),
            SearchResult(
                title="小红书爆款公式：3秒完播率提升技巧",
                url="http://xiaohongshu.com/mock/1",
                content="黄金3秒法则：1. 视觉冲击 2. 强冲突台词 3. 悬念置入...",
                source="xiaohongshu"
            )
        ]

    async def search_writing_methods(self, query: str = "短剧剧本写作教程 爆款公式") -> List[SearchResult]:
        """搜索写作方法论"""
        return [
            SearchResult(
                title="短剧编剧速成：从大纲到分镜的万能模板",
                url="http://xiaohongshu.com/mock/2",
                content="核心公式：困境 -> 金手指 -> 打脸 -> 新危机。每集结尾必须卡在危机点...",
                source="xiaohongshu"
            )
        ]
