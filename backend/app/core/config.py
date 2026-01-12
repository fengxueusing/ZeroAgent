from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ShortPlayAI"
    API_V1_STR: str = "/api/v1"
    
    # Add your keys here or in .env file
    OPENAI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
