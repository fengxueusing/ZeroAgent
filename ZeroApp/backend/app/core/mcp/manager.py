import logging
import json
import os
import sys
from typing import Dict, List, Any, Optional
from .client import MCPClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class MCPManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MCPManager, cls).__new__(cls)
            cls._instance.clients: Dict[str, MCPClient] = {}
            cls._instance.config_path = os.path.join(os.getcwd(), "data", "mcp_config.json")
        return cls._instance

    def __init__(self):
        # Singleton init check
        if hasattr(self, "clients"):
            return

    def load_config(self) -> Dict[str, Any]:
        """Load MCP configuration from file"""
        if not os.path.exists(self.config_path):
            return {"servers": {}}
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load MCP config: {e}")
            return {"servers": {}}

    def save_config(self, config: Dict[str, Any]):
        """Save MCP configuration to file"""
        os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

    def _resolve_config(self, cfg: Dict[str, Any]) -> tuple[str, List[str], Dict[str, str]]:
        """Helper to resolve command, args, and env from config dict"""
        command = cfg.get("command")
        args = cfg.get("args", [])
        env = cfg.get("env", {})
        
        # Resolve placeholders
        final_env = {}
        if env:
            for k, v in env.items():
                if v == "${GITHUB_TOKEN}":
                    val = settings.GITHUB_TOKEN
                    if val: final_env[k] = val
                elif v == "${TAVILY_API_KEY}":
                    val = settings.TAVILY_API_KEY
                    if val: final_env[k] = val
                else:
                    final_env[k] = v
        
        # Resolve relative paths in args (hacky but needed for python scripts)
        resolved_args = []
        for arg in args:
            if arg.endswith(".py") and ".." in arg:
                # Resolve relative to backend root
                # ../mcp_servers/x.py -> D:\...\ZeroApp\mcp_servers\x.py
                abs_path = os.path.abspath(os.path.join(os.getcwd(), arg))
                resolved_args.append(abs_path)
            else:
                resolved_args.append(arg)
        
        # Special case for 'python' command to use current sys.executable
        if command == "python":
            command = sys.executable
            
        return command, resolved_args, final_env

    async def initialize_from_config(self):
        """Initialize and connect servers based on stored config"""
        config = self.load_config()
        servers = config.get("servers", {})
        
        for name, cfg in servers.items():
            if not cfg.get("enabled", True):
                continue
                
            # Skip if already running to avoid unnecessary restarts during full init
            if name in self.clients:
                continue

            try:
                command, resolved_args, final_env = self._resolve_config(cfg)
                logger.info(f"Initializing MCP Server: {name}")
                await self.register_server(name, command, resolved_args, final_env)
            except Exception as e:
                logger.error(f"Failed to initialize server {name}: {e}")

    async def reload_server_from_config(self, name: str):
        """Reload a specific server from config (force restart)"""
        config = self.load_config()
        if "servers" not in config or name not in config["servers"]:
            logger.warning(f"Cannot reload {name}: not found in config")
            return
            
        cfg = config["servers"][name]
        
        # If disabled in config, ensure it's removed
        if not cfg.get("enabled", True):
             await self.remove_server(name)
             return

        try:
            command, resolved_args, final_env = self._resolve_config(cfg)
            logger.info(f"Reloading MCP Server: {name}")
            # register_server handles disconnect/reconnect if exists
            await self.register_server(name, command, resolved_args, final_env)
        except Exception as e:
            logger.error(f"Failed to reload server {name}: {e}")
            raise e

    async def register_server(self, name: str, command: str, args: List[str] = [], env: Dict[str, str] = None):
        """Register and connect to a new MCP server"""
        if name in self.clients:
            logger.warning(f"MCP Server {name} already registered. Reconnecting...")
            await self.clients[name].disconnect()

        client = MCPClient(name, command, args, env)
        await client.connect()
        self.clients[name] = client
        return client

    async def remove_server(self, name: str):
        """Disconnect and remove a server"""
        if name in self.clients:
            await self.clients[name].disconnect()
            del self.clients[name]

    def get_all_tools(self) -> List[Dict[str, Any]]:
        """Get flattened list of all tools from all servers"""
        all_tools = []
        for client_name, client in self.clients.items():
            for tool in client.tools:
                # Add client namespace to tool metadata if needed, 
                # or just return the raw tool structure
                tool_dict = tool.model_dump() if hasattr(tool, "model_dump") else tool
                tool_dict["_server"] = client_name
                all_tools.append(tool_dict)
        return all_tools

    async def call_tool(self, server_name: str, tool_name: str, arguments: Dict[str, Any] = None):
        """Call a tool on a specific server"""
        if server_name not in self.clients:
            raise ValueError(f"Server {server_name} not found")
        
        return await self.clients[server_name].call_tool(tool_name, arguments)

    async def shutdown(self):
        """Shutdown all connections"""
        for name in list(self.clients.keys()):
            await self.remove_server(name)

# Global Instance
mcp_manager = MCPManager()
