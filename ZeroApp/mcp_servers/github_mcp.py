import asyncio
import os
import json
import logging
import httpx
from typing import Any, Dict, List, Optional
from mcp.server.models import InitializationOptions
import mcp.types as types
from mcp.server import Server, NotificationOptions
from mcp.server.stdio import stdio_server

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("github-mcp")

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    logger.warning("GITHUB_TOKEN not found in environment variables. Some features may fail.")

API_BASE = "https://api.github.com"

async def get_headers():
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ZeroAgent-MCP"
    }

server = Server("github-mcp")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="search_repositories",
            description="Search for GitHub repositories",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "limit": {"type": "integer", "default": 5}
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="create_issue",
            description="Create a new issue in a repository",
            inputSchema={
                "type": "object",
                "properties": {
                    "owner": {"type": "string"},
                    "repo": {"type": "string"},
                    "title": {"type": "string"},
                    "body": {"type": "string"}
                },
                "required": ["owner", "repo", "title"]
            }
        ),
        types.Tool(
            name="get_user_info",
            description="Get information about the authenticated user",
            inputSchema={
                "type": "object",
                "properties": {},
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    
    if not arguments:
        arguments = {}

    headers = await get_headers()
    async with httpx.AsyncClient() as client:
        
        if name == "search_repositories":
            query = arguments.get("query")
            limit = arguments.get("limit", 5)
            response = await client.get(
                f"{API_BASE}/search/repositories",
                params={"q": query, "per_page": limit},
                headers=headers
            )
            data = response.json()
            items = data.get("items", [])
            
            result_text = ""
            for item in items:
                result_text += f"- {item['full_name']}: {item['html_url']} (Stars: {item['stargazers_count']})\n"
                
            return [types.TextContent(type="text", text=result_text)]

        elif name == "create_issue":
            owner = arguments.get("owner")
            repo = arguments.get("repo")
            title = arguments.get("title")
            body = arguments.get("body", "")
            
            url = f"{API_BASE}/repos/{owner}/{repo}/issues"
            payload = {"title": title, "body": body}
            
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code == 201:
                data = response.json()
                return [types.TextContent(type="text", text=f"Issue created: {data['html_url']}")]
            else:
                return [types.TextContent(type="text", text=f"Failed to create issue: {response.text}")]

        elif name == "get_user_info":
            response = await client.get(f"{API_BASE}/user", headers=headers)
            if response.status_code == 200:
                data = response.json()
                return [types.TextContent(type="text", text=f"User: {data['login']}\nURL: {data['html_url']}")]
            else:
                return [types.TextContent(type="text", text=f"Failed to get user info: {response.text}")]

        else:
            raise ValueError(f"Unknown tool: {name}")

async def main():
    # Run the server using stdin/stdout
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="github-mcp",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
