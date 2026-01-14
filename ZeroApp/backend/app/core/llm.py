from openai import AsyncOpenAI
from app.core.config import settings
from typing import Optional

class LLMFactory:
    _client: Optional[AsyncOpenAI] = None
    _last_key: Optional[str] = None
    _last_base_url: Optional[str] = None

    @classmethod
    def get_client(cls) -> Optional[AsyncOpenAI]:
        """
        Get or initialize the AsyncOpenAI client based on current settings.
        Handles provider switching automatically via Base URL.
        """
        current_key = settings.LLM_API_KEY
        current_base_url = settings.LLM_BASE_URL

        if not current_key:
            return None

        # Re-initialize if config changed
        if (cls._client is None or 
            cls._last_key != current_key or 
            cls._last_base_url != current_base_url):
            
            print(f"[LLM Factory] Initializing Client for {settings.LLM_PROVIDER} at {current_base_url}")
            
            cls._client = AsyncOpenAI(
                api_key=current_key,
                base_url=current_base_url,
                default_headers={"Authorization": f"Bearer {current_key}"}
            )
            cls._last_key = current_key
            cls._last_base_url = current_base_url

        return cls._client

    @classmethod
    def get_model(cls) -> str:
        return settings.LLM_MODEL
