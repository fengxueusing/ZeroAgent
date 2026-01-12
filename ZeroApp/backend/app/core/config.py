import os
import json
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ZeroApp"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "*"]
    
    # API KEYS (Loaded from env first, can be overridden by user_settings.json)
    # LLM Settings
    LLM_PROVIDER: str = "openai"  # openai, deepseek, siliconflow, gemini, minimax
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
    LLM_MODEL: str = "gpt-4-turbo-preview"
    
    # Tool Keys
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    
    # Void System
    VOID_CHECK_INTERVAL: int = 60  # seconds

    class Config:
        case_sensitive = True
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._load_user_settings()

    def _load_user_settings(self):
        """Load user overrides from json file"""
        settings_path = os.path.join(os.getcwd(), "data", "user_settings.json")
        if os.path.exists(settings_path):
            try:
                with open(settings_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "LLM_PROVIDER" in data: self.LLM_PROVIDER = data["LLM_PROVIDER"]
                    if "LLM_API_KEY" in data: self.LLM_API_KEY = data["LLM_API_KEY"]
                    if "LLM_BASE_URL" in data: self.LLM_BASE_URL = data["LLM_BASE_URL"]
                    if "LLM_MODEL" in data: self.LLM_MODEL = data["LLM_MODEL"]
                    if "TAVILY_API_KEY" in data: self.TAVILY_API_KEY = data["TAVILY_API_KEY"]
                    if "GITHUB_TOKEN" in data: self.GITHUB_TOKEN = data["GITHUB_TOKEN"]
            except Exception as e:
                print(f"Failed to load user settings: {e}")

    def save_user_settings(self, 
                          llm_provider: Optional[str] = None,
                          llm_key: Optional[str] = None,
                          llm_base_url: Optional[str] = None,
                          llm_model: Optional[str] = None,
                          tavily_key: Optional[str] = None,
                          github_token: Optional[str] = None):
        """Save user overrides to json file"""
        settings_path = os.path.join(os.getcwd(), "data", "user_settings.json")
        
        # Load existing first
        data = {}
        if os.path.exists(settings_path):
            try:
                with open(settings_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except:
                pass
        
        # Update
        if llm_provider is not None:
            self.LLM_PROVIDER = llm_provider
            data["LLM_PROVIDER"] = llm_provider
        
        if llm_key is not None:
            self.LLM_API_KEY = llm_key
            data["LLM_API_KEY"] = llm_key
            
        if llm_base_url is not None:
            self.LLM_BASE_URL = llm_base_url
            data["LLM_BASE_URL"] = llm_base_url

        if llm_model is not None:
            self.LLM_MODEL = llm_model
            data["LLM_MODEL"] = llm_model
        
        if tavily_key is not None:
            self.TAVILY_API_KEY = tavily_key
            data["TAVILY_API_KEY"] = tavily_key
            
        if github_token is not None:
            self.GITHUB_TOKEN = github_token
            data["GITHUB_TOKEN"] = github_token

        # Ensure dir exists
        os.makedirs(os.path.dirname(settings_path), exist_ok=True)
        
        with open(settings_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

settings = Settings()
