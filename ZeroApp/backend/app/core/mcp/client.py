import asyncio
import logging
from typing import Optional, List, Dict, Any
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

logger = logging.getLogger(__name__)

class MCPClient:
    def __init__(self, name: str, command: str, args: List[str] = [], env: Dict[str, str] = None):
        self.name = name
        self.server_params = StdioServerParameters(
            command=command,
            args=args,
            env=env
        )
        self.session: Optional[ClientSession] = None
        self._exit_stack: Optional[AsyncExitStack] = None
        self.tools: List[Any] = []

    async def connect(self):
        """Connect to the MCP Server and initialize session"""
        try:
            self._exit_stack = AsyncExitStack()
            
            # Start stdio client
            read, write = await self._exit_stack.enter_async_context(
                stdio_client(self.server_params)
            )
            
            # Start session
            self.session = await self._exit_stack.enter_async_context(
                ClientSession(read, write)
            )
            
            # Initialize with timeout
            await asyncio.wait_for(self.session.initialize(), timeout=10.0)
            logger.info(f"Connected to MCP Server: {self.name}")
            
            # List tools immediately with timeout
            await asyncio.wait_for(self.refresh_tools(), timeout=10.0)
            
        except asyncio.TimeoutError:
            logger.error(f"Timeout connecting to MCP Server {self.name}")
            await self.disconnect()
            raise RuntimeError(f"Timeout connecting to server {self.name}")
        except Exception as e:
            logger.error(f"Failed to connect to MCP Server {self.name}: {e}")
            await self.disconnect()
            raise

    async def disconnect(self):
        """Disconnect and cleanup"""
        if self._exit_stack:
            await self._exit_stack.aclose()
        self.session = None
        self._exit_stack = None
        logger.info(f"Disconnected from MCP Server: {self.name}")

    async def refresh_tools(self):
        """Fetch available tools from the server"""
        if not self.session:
            raise RuntimeError(f"Client {self.name} is not connected")
        
        result = await self.session.list_tools()
        self.tools = result.tools
        logger.info(f"Fetched {len(self.tools)} tools from {self.name}")
        return self.tools

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any] = None):
        """Call a specific tool"""
        if not self.session:
            raise RuntimeError(f"Client {self.name} is not connected")
            
        # Add 30s timeout for tool execution
        try:
            result = await asyncio.wait_for(
                self.session.call_tool(tool_name, arguments or {}), 
                timeout=30.0
            )
            return result
        except asyncio.TimeoutError:
            raise RuntimeError(f"Tool execution timed out ({30}s)")
