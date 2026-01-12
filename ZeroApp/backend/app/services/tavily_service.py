from tavily import TavilyClient
from app.core.config import settings
from typing import List, Dict, Any

class TavilyService:
    def __init__(self):
        self.client = None
        self.last_api_key = None

    def _get_client(self):
        current_key = settings.TAVILY_API_KEY
        if current_key:
            # Initialize or Re-initialize if key changed
            if self.client is None or self.last_api_key != current_key:
                print(f"[Tavily] Initializing client with new key...")
                self.client = TavilyClient(api_key=current_key)
                self.last_api_key = current_key
            return self.client
        return None

    async def search(self, query: str, search_depth: str = "basic", max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Execute a search query using Tavily.
        Returns a list of results with title, content, and url.
        """
        client = self._get_client()
        
        if not client:
            # Mock mode if no API key
            return self._mock_search(query)

        try:
            response = client.search(
                query=query,
                search_depth=search_depth,
                max_results=max_results,
                include_images=False,
                include_answer=True
            )
            return response.get("results", [])
        except Exception as e:
            print(f"[Tavily] Search Error: {e}")
            return []

    def _mock_search(self, query: str) -> List[Dict[str, Any]]:
        return [
            {
                "title": f"Mock Result for {query}",
                "content": "This is a simulated high-entropy search result containing random internet noise and potential trends.",
                "url": "http://mock-internet.com/trend/1",
                "score": 0.95
            },
            {
                "title": "Another Hot Topic",
                "content": "People are discussing the latest AI developments and their impact on digital solitude.",
                "url": "http://mock-internet.com/trend/2",
                "score": 0.88
            }
        ]

tavily_service = TavilyService()
