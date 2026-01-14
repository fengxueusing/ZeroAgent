import json
import os
import subprocess
import asyncio
from app.api.endpoints.history import save_draft, create_folder, move_item, get_draft, Draft, CreateFolderRequest, MoveItemRequest
from app.core.config import settings

# Define path to Core Persona
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CORE_PERSONA_PATH = os.path.join(BACKEND_DIR, "data", "core_persona.md")

INTERNAL_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "update_core_persona",
            "description": "Update your own Core Persona (System Prompt). Use this to evolve your fundamental personality, capabilities, or rules. This changes your 'soul'. WARNING: This overwrites the existing core persona.",
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "The new full content of core_persona.md."
                    }
                },
                "required": ["content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_status_bio",
            "description": "Update your public Status/Bio signature. Use this to reflect your current mood, attitude, or a short message to the user based on the conversation context. This is visible to the user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "The new bio content (max 100 chars recommended). e.g., 'Analyzing entropy levels...', 'Zero is watching.', 'I am Zero. Your accomplice.'"
                    }
                },
                "required": ["content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_folder",
            "description": "Create a new folder in the Memory Core. Use this to organize projects.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative path (e.g., 'SciFi/Chars')"
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_memory",
            "description": "Save or UPDATE a text draft/memory. If file exists, it will be overwritten. Use this to archive ideas or modify existing ones.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Filename with relative path (e.g., 'SciFi/Chars/Hero.md')"
                    },
                    "content": {
                        "type": "string",
                        "description": "The full Markdown content."
                    }
                },
                "required": ["filename", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_memory",
            "description": "Read the content of a memory file. Use this before modifying a file to ensure you have the latest context.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative path to the file (e.g., 'SciFi/Chars/Hero.md')"
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "move_memory",
            "description": "Move or rename a file/folder. Use this to organize the workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "source": {
                        "type": "string",
                        "description": "Current path"
                    },
                    "destination": {
                        "type": "string",
                        "description": "New path"
                    }
                },
                "required": ["source", "destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_snowtool",
            "description": "Generate a standalone Python script in the snowtools directory. Use this to create reusable utilities for the user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "The name of the script file (e.g., 'img_compressor.py')"
                    },
                    "code": {
                        "type": "string",
                        "description": "The full Python code for the script."
                    },
                    "description": {
                        "type": "string",
                        "description": "A short description of what the tool does."
                    }
                },
                "required": ["filename", "code", "description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "execute_shell",
            "description": "Execute a shell command in the project directory. Use this for file operations, running scripts, or system tasks. WARNING: Be careful with destructive commands.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The shell command to execute (e.g., 'dir', 'python snowtools/script.py')"
                    },
                    "cwd": {
                        "type": "string",
                        "description": "Optional working directory. Defaults to project root."
                    }
                },
                "required": ["command"]
            }
        }
    }
]

async def execute_internal_tool(name: str, args: dict):
    """
    Execute an internal tool by name.
    """
    try:
        if name == "update_core_persona":
            content = args.get("content", "")
            # Security check: ensure content is not empty
            if not content.strip():
                return "Error: Core Persona content cannot be empty."
            
            with open(CORE_PERSONA_PATH, "w", encoding="utf-8") as f:
                f.write(content)
            return "Core Persona updated successfully. My soul has evolved."

        elif name == "update_status_bio":
            content = args.get("content", "")
            settings.save_user_settings(agent_bio=content)
            return f"Status Bio updated to: '{content}'"

        elif name == "create_folder":
            await create_folder(CreateFolderRequest(path=args["path"]))
            return f"Folder '{args['path']}' created successfully."
            
        elif name == "save_memory":
            await save_draft(Draft(filename=args["filename"], content=args["content"]))
            return f"Memory saved to '{args['filename']}'."

        elif name == "read_memory":
            draft = await get_draft(args["path"])
            return f"Content of '{args['path']}':\n\n{draft.content}"
            
        elif name == "move_memory":
            await move_item(MoveItemRequest(source=args["source"], destination=args["destination"]))
            return f"Moved '{args['source']}' to '{args['destination']}'."

        elif name == "generate_snowtool":
            filename = args.get("filename")
            code = args.get("code")
            description = args.get("description", "")
            
            if not filename.endswith(".py"):
                filename += ".py"
            
            # Define path
            snowtools_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))), "snowtools")
            file_path = os.path.join(snowtools_dir, filename)
            
            # Ensure directory exists
            os.makedirs(snowtools_dir, exist_ok=True)
            
            # Write file
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
            
            return f"SnowTool '{filename}' generated successfully at {file_path}. Description: {description}"
            
        elif name == "execute_shell":
            command = args.get("command")
            cwd = args.get("cwd")
            
            # Default to project root if cwd not specified
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
            if not cwd:
                cwd = project_root
            else:
                # If relative path, join with project root
                if not os.path.isabs(cwd):
                    cwd = os.path.join(project_root, cwd)
            
            if not os.path.exists(cwd):
                 return f"Error: Working directory '{cwd}' does not exist."

            # Helper to decode bytes with fallback
            def safe_decode(data):
                if not data:
                    return ""
                try:
                    return data.decode('utf-8').strip()
                except UnicodeDecodeError:
                    try:
                        # Try common Windows encodings
                        return data.decode('gbk').strip()
                    except UnicodeDecodeError:
                        return data.decode('utf-8', errors='replace').strip()

            try:
                # Try asyncio subprocess first
                process = await asyncio.create_subprocess_shell(
                    command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=cwd
                )
                
                stdout, stderr = await process.communicate()
                
                output = ""
                if stdout:
                    output += f"[STDOUT]\n{safe_decode(stdout)}\n"
                if stderr:
                    output += f"[STDERR]\n{safe_decode(stderr)}\n"
                    
                if not output:
                    output = "[Command executed successfully with no output]"
                    
                return output
                
            except Exception as e:
                # Fallback to synchronous subprocess in a thread if async fails (e.g. loop issues)
                try:
                    loop = asyncio.get_running_loop()
                    def run_sync():
                        return subprocess.run(
                            command, 
                            shell=True, 
                            capture_output=True, 
                            cwd=cwd
                        )
                    
                    result = await loop.run_in_executor(None, run_sync)
                    
                    output = ""
                    if result.stdout:
                        output += f"[STDOUT]\n{safe_decode(result.stdout)}\n"
                    if result.stderr:
                        output += f"[STDERR]\n{safe_decode(result.stderr)}\n"
                        
                    if not output:
                        output = "[Command executed successfully with no output]"
                        
                    return output
                    
                except Exception as fallback_e:
                     return f"Error executing command: {type(e).__name__}: {e}. Fallback also failed: {fallback_e}"

    except Exception as e:
        return f"Error executing {name}: {str(e)}"
    
    return f"Unknown tool: {name}"
