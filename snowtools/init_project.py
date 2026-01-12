import os
import pathlib

def create_structure():
    base_dir = pathlib.Path(r"d:\AI_project\ShortPlayAI")
    backend_dir = base_dir / "backend"
    
    # 定义目录结构
    dirs = [
        backend_dir / "app" / "api" / "v1" / "endpoints",
        backend_dir / "app" / "core",
        backend_dir / "app" / "models",
        backend_dir / "app" / "schemas",
        backend_dir / "app" / "services" / "llm",
        backend_dir / "app" / "services" / "image",
        backend_dir / "app" / "services" / "audio",
        backend_dir / "app" / "services" / "video",
        backend_dir / "tests",
    ]
    
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
        # 创建 __init__.py
        (d / "__init__.py").touch()
        
    # 创建基础文件
    
    # 1. requirements.txt
    req_content = """fastapi>=0.100.0
uvicorn>=0.23.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-dotenv>=1.0.0
openai>=1.0.0
langchain>=0.0.300
moviepy>=1.0.3
edge-tts>=6.1.8
sqlalchemy>=2.0.0
alembic>=1.11.0
requests>=2.31.0
"""
    (backend_dir / "requirements.txt").write_text(req_content, encoding="utf-8")
    
    # 2. main.py
    main_content = """from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.get("/")
async def root():
    return {"message": "Welcome to ShortPlayAI Backend", "version": "0.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
"""
    (backend_dir / "main.py").write_text(main_content, encoding="utf-8")
    
    # 3. config.py
    config_content = """from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ShortPlayAI"
    API_V1_STR: str = "/api/v1"
    
    # Add your keys here or in .env file
    OPENAI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
"""
    (backend_dir / "app" / "core" / "config.py").write_text(config_content, encoding="utf-8")

    print(f"Project structure initialized at {backend_dir}")

if __name__ == "__main__":
    create_structure()
