from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import chat, agent, hunt, files, settings as api_settings, mcp

from app.core.mcp.manager import mcp_manager
import os
import sys

from fastapi.staticfiles import StaticFiles
import os

def create_app() -> FastAPI:
    app = FastAPI(
        title="ZeroApp Backend",
        description="The Void Engine Powered Agent Backend",
        version="1.0.0",
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    # Mount static files
    os.makedirs("data/uploads", exist_ok=True)
    app.mount("/static", StaticFiles(directory="data/uploads"), name="static")

    # Startup Event
    @app.on_event("startup")
    async def startup_event():
        print("[MCP] Initializing from configuration...")
        try:
            await mcp_manager.initialize_from_config()
            print("[MCP] Initialization complete.")
        except Exception as e:
            print(f"[MCP] Critical initialization error: {e}")

    # CORS 配置
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # 注册路由
    app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
    app.include_router(agent.router, prefix=f"{settings.API_V1_STR}/agent", tags=["agent"])
    app.include_router(hunt.router, prefix=f"{settings.API_V1_STR}/hunt", tags=["hunt"])
    app.include_router(files.router, prefix=f"{settings.API_V1_STR}/files", tags=["files"])
    app.include_router(api_settings.router, prefix=f"{settings.API_V1_STR}/settings", tags=["settings"])
    from app.api.endpoints import modules
    app.include_router(modules.router, prefix=f"{settings.API_V1_STR}/modules", tags=["modules"])
    app.include_router(mcp.router, prefix=f"{settings.API_V1_STR}/mcp", tags=["mcp"])
    # History/Memory Router
    from app.api.endpoints import history
    app.include_router(history.router, prefix=f"{settings.API_V1_STR}/history", tags=["history"])

    @app.get("/")
    async def root():
        return {"message": "ZeroAgent Backend is Active", "void_status": "Listening"}

    return app

app = create_app()
