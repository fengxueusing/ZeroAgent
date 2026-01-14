import json
import logging
import os
from typing import List, Dict, Any, Union
from app.core.llm import LLMFactory
from app.core.mcp.manager import mcp_manager
from app.models.agent import ChatMessage, ChatResponse
from app.services.agent.internal_tools import INTERNAL_TOOLS, execute_internal_tool

logger = logging.getLogger(__name__)

# Define Paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")
CORE_PERSONA_PATH = os.path.join(DATA_DIR, "core_persona.md")
MODULES_DIR = os.path.join(DATA_DIR, "modules")

class ZeroAgent:
    """
    ZeroAgent is the central intelligence that can use MCP tools to interact with the world.
    It implements the ReAct loop or Function Calling loop compatible with OpenAI API.
    """
    
    def __init__(self):
        self.max_steps = 10  # Max conversation turns to prevent infinite loops

    def _load_file(self, path: str) -> str:
        try:
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to load file {path}: {e}")
            return ""

    def _build_system_prompt(self, module_name="default") -> str:
        # 1. Load Core Persona
        core = self._load_file(CORE_PERSONA_PATH)
        if not core:
            core = "You are Yan Tianxue (Zero). You have access to tools. Use them freely."

        # 2. Load Module
        module_path = os.path.join(MODULES_DIR, f"{module_name}.md")
        module_content = self._load_file(module_path)
        
        # 3. Assemble
        full_prompt = f"{core}\n\n---\n\n[CURRENT MISSION MODULE: {module_name.upper()}]\n{module_content}"
        return full_prompt


    def _truncate_messages(self, messages: List[Dict[str, Any]], max_tokens: int = 12000) -> List[Dict[str, Any]]:
        """
        Simple heuristic truncation: Keep System prompt + recent messages.
        Discard middle messages if too long.
        Assumes ~4 chars per token.
        """
        # Always keep system messages
        system_msgs = [m for m in messages if m["role"] == "system"]
        other_msgs = [m for m in messages if m["role"] != "system"]
        
        # Calculate rough token usage
        total_chars = sum(len(str(m.get("content", ""))) for m in messages)
        estimated_tokens = total_chars / 4
        
        if estimated_tokens <= max_tokens:
            return messages
            
        # Truncate logic: Keep last N messages that fit
        kept_msgs = []
        current_chars = sum(len(str(m.get("content", ""))) for m in system_msgs)
        
        # Reverse iterate to keep most recent
        for msg in reversed(other_msgs):
            msg_len = len(str(msg.get("content", "")))
            if current_chars + msg_len > (max_tokens * 4):
                break
            kept_msgs.insert(0, msg)
            current_chars += msg_len
            
        print(f"ZeroAgent: Context truncated. Original: {len(messages)}, Kept: {len(system_msgs) + len(kept_msgs)}")
        return system_msgs + kept_msgs

    async def chat_generator(self, messages: List[Dict[str, Any]], module_name: str = "default", context_data: str = None, conversation_id: str = None, history_service: Any = None):
        """
        Generator that yields streaming updates from the agent's thought process.
        Yields dicts: {"type": "...", "data": ...}
        """
        print(f"ZeroAgent: Stream request received. Module: {module_name}")
        client = LLMFactory.get_client()
        model = LLMFactory.get_model()
        
        if not client:
            yield {"type": "error", "content": "LLM Client not initialized."}
            return

        try:
            mcp_tools = mcp_manager.get_all_tools()
            openai_tools = self._convert_mcp_to_openai_tools(mcp_tools)
            
            # Merge Internal Tools
            if not openai_tools:
                openai_tools = []
            openai_tools.extend(INTERNAL_TOOLS)
            
        except Exception as e:
            yield {"type": "error", "content": f"Error fetching tools: {e}"}
            return
        
        current_messages = messages.copy()
        
        if not any(m["role"] == "system" for m in current_messages):
            system_prompt = self._build_system_prompt(module_name)
            
            # Inject Context if provided
            if context_data:
                system_prompt += f"\n\n---\n[SHORT TERM MEMORY / CONTEXT]\n{context_data}\n---"
                
            current_messages.insert(0, {
                "role": "system", 
                "content": system_prompt
            })

        # Apply Truncation before sending to LLM
        truncated_messages = self._truncate_messages(current_messages)

        step_count = 0
        while step_count < self.max_steps:
            try:
                # 1. Call LLM with Streaming
                stream = await client.chat.completions.create(
                    model=model,
                    messages=truncated_messages, # Use truncated list for context
                    tools=openai_tools if openai_tools else None,
                    tool_choice="auto" if openai_tools else None,
                    stream=True
                )
                
                full_content = ""
                tool_calls_dict = {} # Map index to tool call object
                
                async for chunk in stream:
                    delta = chunk.choices[0].delta
                    
                    # Handle Text Content
                    if delta.content:
                        content_chunk = delta.content
                        full_content += content_chunk
                        yield {"type": "content_delta", "content": content_chunk}
                    
                    # Handle Tool Call Deltas
                    if delta.tool_calls:
                        for tc_delta in delta.tool_calls:
                            index = tc_delta.index
                            if index not in tool_calls_dict:
                                tool_calls_dict[index] = {
                                    "id": tc_delta.id,
                                    "type": "function",
                                    "function": {
                                        "name": "",
                                        "arguments": ""
                                    }
                                }
                            
                            # Append parts
                            if tc_delta.id:
                                tool_calls_dict[index]["id"] = tc_delta.id
                            if tc_delta.function:
                                if tc_delta.function.name:
                                    tool_calls_dict[index]["function"]["name"] += tc_delta.function.name
                                if tc_delta.function.arguments:
                                    tool_calls_dict[index]["function"]["arguments"] += tc_delta.function.arguments
                
                # Reconstruct complete message for history
                assistant_message = {
                    "role": "assistant",
                    "content": full_content if full_content else None,
                }
                
                tool_calls = []
                if tool_calls_dict:
                    tool_calls = [tool_calls_dict[i] for i in sorted(tool_calls_dict.keys())]
                    assistant_message["tool_calls"] = tool_calls
                
                current_messages.append(assistant_message)
                
                # SAVE TO HISTORY: Assistant Message
                if conversation_id and history_service:
                    await history_service.add_message(conversation_id, assistant_message)

                # 2. Check for Tool Calls
                if tool_calls:
                    for tool_call in tool_calls:
                        func_name = tool_call["function"]["name"]
                        try:
                            args = json.loads(tool_call["function"]["arguments"])
                        except json.JSONDecodeError:
                            args = {} # Handle parse error
                            
                        call_id = tool_call["id"]
                        
                        # Notify Tool Start
                        yield {
                            "type": "tool_start", 
                            "tool": func_name, 
                            "args": args
                        }
                        
                        # Execute
                        target_server = None
                        original_tool_name = func_name
                        
                        # Check Internal First
                        is_internal = any(t["function"]["name"] == func_name for t in INTERNAL_TOOLS)
                        
                        tool_result_content = ""
                        is_error = False
                        
                        try:
                            if is_internal:
                                tool_result_content = await execute_internal_tool(func_name, args)
                            else:
                                for tool in mcp_tools:
                                    if tool["name"] == func_name:
                                        target_server = tool["_server"]
                                        break
                                
                                if not target_server and "__" in func_name:
                                    parts = func_name.split("__", 1)
                                    target_server = parts[0]
                                    original_tool_name = parts[1]
                                    
                                if target_server:
                                    result = await mcp_manager.call_tool(target_server, original_tool_name, args)
                                    # Serialize result
                                    content_list = []
                                    if hasattr(result, 'content'):
                                        for item in result.content:
                                            if item.type == 'text':
                                                content_list.append(item.text)
                                            elif item.type == 'image':
                                                content_list.append("[Image Content]")
                                        tool_result_content = "\n".join(content_list)
                                    else:
                                        tool_result_content = str(result)
                                else:
                                    tool_result_content = f"Error: Tool {func_name} not found."
                                    is_error = True
                        except Exception as e:
                            tool_result_content = f"Error executing tool: {str(e)}"
                            is_error = True
                        
                        # Notify Tool End
                        yield {
                            "type": "tool_end",
                            "tool": func_name,
                            "result": tool_result_content[:200] + "..." if len(tool_result_content) > 200 else tool_result_content,
                            "is_error": is_error
                        }
                        
                        tool_msg = {
                            "tool_call_id": call_id,
                            "role": "tool",
                            "name": func_name,
                            "content": tool_result_content
                        }
                        current_messages.append(tool_msg)
                        
                        # SAVE TO HISTORY: Tool Result
                        if conversation_id and history_service:
                            await history_service.add_message(conversation_id, tool_msg)
                    
                    step_count += 1
                    continue
                
                else:
                    # Final text response done
                    return
            
            except Exception as e:
                print(f"ZeroAgent: Error in loop: {e}")
                yield {"type": "error", "content": f"Agent Loop Error: {e}"}
                return

        yield {"type": "content", "content": "\n[System: Max conversation steps reached]"}
        return

    async def chat(self, messages: List[Dict[str, Any]], module_name: str = "default") -> ChatResponse:
        """
        Process a chat request with MCP tool capabilities.
        """
        print(f"ZeroAgent: Chat request received. Module: {module_name}")
        client = LLMFactory.get_client()
        model = LLMFactory.get_model()
        
        if not client:
            print("ZeroAgent: Error - LLM Client not initialized.")
            return ChatResponse(content="System Error: LLM Client not initialized.")

        try:
            # 1. Get Tools from MCP Manager and convert to OpenAI format
            print("ZeroAgent: Fetching MCP tools...")
            mcp_tools = mcp_manager.get_all_tools()
            openai_tools = self._convert_mcp_to_openai_tools(mcp_tools)
            print(f"ZeroAgent: Available tools count: {len(openai_tools)}")
        except Exception as e:
            print(f"ZeroAgent: Error fetching tools: {e}")
            return ChatResponse(content=f"Error fetching tools: {e}")
        
        current_messages = messages.copy()
        
        # System Prompt injection if not present
        if not any(m["role"] == "system" for m in current_messages):
            system_prompt = self._build_system_prompt(module_name)
            current_messages.insert(0, {
                "role": "system", 
                "content": system_prompt
            })

        step_count = 0
        
        while step_count < self.max_steps:
            try:
                print(f"ZeroAgent: Step {step_count + 1} - Calling LLM...")
                # 2. Call LLM
                response = await client.chat.completions.create(
                    model=model,
                    messages=current_messages,
                    tools=openai_tools if openai_tools else None,
                    tool_choice="auto" if openai_tools else None
                )
                
                response_message = response.choices[0].message
                print(f"ZeroAgent: LLM Response received. Content: {response_message.content[:50] if response_message.content else 'None'}...")
                
                # 3. Check for Tool Calls
                if response_message.tool_calls:
                    print(f"ZeroAgent: Tool Calls detected: {len(response_message.tool_calls)}")
                    # Append the assistant's message with tool calls to history
                    current_messages.append(response_message)
                    
                    # Execute each tool call
                    for tool_call in response_message.tool_calls:
                        function_name = tool_call.function.name
                        arguments = json.loads(tool_call.function.arguments)
                        call_id = tool_call.id
                        
                        print(f"ZeroAgent: Processing tool call {function_name} with args {arguments}")
                        
                        # Find which server this tool belongs to
                        # We encoded server name in the tool name or need a lookup
                        # Strategy: We can't easily know the server from just the name if names collide.
                        # But our _convert_mcp_to_openai_tools helper can handle name mangling if needed.
                        # For now, let's assume unique names or search in mcp_tools.
                        
                        target_server = None
                        original_tool_name = function_name
                        
                        # Search for the tool in mcp_tools to get the server name
                        # Note: This is O(N) but N is small.
                        for tool in mcp_tools:
                            # Handle name mangling if we did it (e.g. server__tool)
                            # Or just matching name
                            if tool["name"] == function_name:
                                target_server = tool["_server"]
                                break
                                
                        if not target_server:
                            # Fallback: maybe it's namespaced like "server__tool"
                            if "__" in function_name:
                                parts = function_name.split("__", 1)
                                target_server = parts[0]
                                original_tool_name = parts[1]
                        
                        tool_result_content = ""
                        try:
                            if target_server:
                                print(f"Executing Tool: {original_tool_name} on Server: {target_server}")
                                result = await mcp_manager.call_tool(target_server, original_tool_name, arguments)
                                
                                # MCP returns a CallToolResult object or similar
                                # result.content is a list of TextContent or ImageContent
                                # We need to serialize it to string for OpenAI
                                content_list = []
                                if hasattr(result, 'content'):
                                    for item in result.content:
                                        if item.type == 'text':
                                            content_list.append(item.text)
                                        elif item.type == 'image':
                                            content_list.append("[Image Content]")
                                    tool_result_content = "\n".join(content_list)
                                else:
                                    tool_result_content = str(result)
                                print(f"Tool execution result length: {len(tool_result_content)}")
                            else:
                                tool_result_content = f"Error: Tool {function_name} not found."
                                print(tool_result_content)
                        except Exception as e:
                            tool_result_content = f"Error executing tool: {str(e)}"
                            print(tool_result_content)

                        # Append Tool Output
                        current_messages.append({
                            "tool_call_id": call_id,
                            "role": "tool",
                            "name": function_name,
                            "content": tool_result_content
                        })
                    
                    # Continue loop to let LLM process tool results
                    step_count += 1
                    continue
                
                else:
                    # No tool calls, just text response. We are done.
                    print("ZeroAgent: Final response generated.")
                    # Append final response to history
                    # Wait, response_message IS the final response if we are here.
                    # But if we had tool calls before, current_messages has them.
                    # We should append the final response to current_messages too?
                    # No, loop continues if tool calls. If no tool calls, response_message is the answer.
                    # We should add it to current_messages to have a complete history.
                    current_messages.append(response_message)
                    
                    # Convert objects to dicts for serialization
                    serializable_messages = []
                    for m in current_messages:
                        if hasattr(m, 'model_dump'):
                            serializable_messages.append(m.model_dump(exclude_none=True))
                        elif hasattr(m, 'to_dict'):
                             serializable_messages.append(m.to_dict())
                        elif isinstance(m, dict):
                            serializable_messages.append(m)
                        else:
                            # Fallback for OpenAI objects if they don't have model_dump (e.g. dict-like access)
                            try:
                                serializable_messages.append(dict(m))
                            except:
                                serializable_messages.append(str(m))

                    return ChatResponse(content=response_message.content, messages=serializable_messages)

            except Exception as e:
                print(f"ZeroAgent Chat Error: {e}")
                return ChatResponse(content=f"An error occurred: {str(e)}", messages=[])
        
        return ChatResponse(content="Max conversation steps reached.", messages=[])

    def _convert_mcp_to_openai_tools(self, mcp_tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert MCP tool definitions to OpenAI tool schema.
        MCP: { name, description, inputSchema }
        OpenAI: { type: "function", function: { name, description, parameters } }
        """
        openai_tools = []
        for tool in mcp_tools:
            # Handle potential name collisions by checking if we need namespacing?
            # For now, keep it simple.
            
            openai_tool = {
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool.get("description", ""),
                    "parameters": tool.get("inputSchema", {})
                }
            }
            openai_tools.append(openai_tool)
        return openai_tools
