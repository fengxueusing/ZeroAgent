from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.mcp.manager import mcp_manager

router = APIRouter()

class ServerConfig(BaseModel):
    name: str
    command: str
    args: List[str] = []
    env: Optional[Dict[str, str]] = None
    enabled: bool = True

class ToolCallRequest(BaseModel):
    server_name: str
    tool_name: str
    arguments: Optional[Dict[str, Any]] = None

@router.get("/servers")
async def list_servers():
    """List all configured servers and their status"""
    config = mcp_manager.load_config()
    servers = config.get("servers", {})
    
    result = []
    for name, cfg in servers.items():
        status = "connected" if name in mcp_manager.clients else "disconnected"
        if not cfg.get("enabled", True):
            status = "disabled"
            
        # Inject name into config so frontend has it for updates
        cfg_with_name = cfg.copy()
        cfg_with_name["name"] = name
            
        result.append({
            "name": name,
            "config": cfg_with_name,
            "status": status
        })
    return result

@router.post("/servers")
async def add_server(config: ServerConfig):
    """Add or update a server configuration"""
    current_config = mcp_manager.load_config()
    
    server_entry = {
        "command": config.command,
        "args": config.args,
        "env": config.env or {},
        "enabled": config.enabled
    }
    
    if "servers" not in current_config:
        current_config["servers"] = {}
        
    current_config["servers"][config.name] = server_entry
    mcp_manager.save_config(current_config)
    
    # If enabled, try to connect immediately
    if config.enabled:
        try:
            # Only reload the specific server being modified
            await mcp_manager.reload_server_from_config(config.name)
        except Exception as e:
            return {"status": "saved_but_failed_to_connect", "error": str(e)}
    else:
        # If disabled, ensure it is disconnected
        await mcp_manager.remove_server(config.name)
            
    return {"status": "saved", "server": config.name}

@router.put("/servers/{name}")
async def update_server(name: str, config: ServerConfig):
    """Update an existing server"""
    # Same logic as add for now
    if config.name != name:
        raise HTTPException(status_code=400, detail="Name mismatch")
    return await add_server(config)

@router.delete("/servers/{name}")
async def remove_server(name: str):
    """Remove an MCP server"""
    current_config = mcp_manager.load_config()
    if "servers" in current_config and name in current_config["servers"]:
        del current_config["servers"][name]
        mcp_manager.save_config(current_config)
    
    # Disconnect runtime
    await mcp_manager.remove_server(name)
    return {"status": "removed", "server": name}

@router.get("/tools")
async def list_tools():
    """List all available tools from all connected MCP servers"""
    return mcp_manager.get_all_tools()

@router.post("/call")
async def call_tool(request: ToolCallRequest):
    """Call a specific tool"""
    try:
        result = await mcp_manager.call_tool(
            server_name=request.server_name,
            tool_name=request.tool_name,
            arguments=request.arguments
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

