import os
import json
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

CONVERSATIONS_DIR = "data/conversations"

# We use a flexible Dict for messages to accommodate OpenAI ChatMessage structure (content, tool_calls, etc.)
from app.core.llm import LLMFactory

class Conversation(BaseModel):
    id: str
    title: str
    created_at: float
    updated_at: float
    messages: List[Dict[str, Any]]
    tags: List[str] = []

class HistoryService:
    def __init__(self, storage_dir: str = "data/conversations"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        self.conversations: Dict[str, Conversation] = {}
        self._load_conversations()

    def _load_conversations(self):
        # We don't load all into memory on init anymore to save memory
        # We rely on file system
        pass

    def _get_file_path(self, conversation_id: str) -> str:
        return os.path.join(self.storage_dir, f"{conversation_id}.json")

    async def create_conversation(self, title: str = "New Chat") -> Conversation:
        conv_id = str(uuid.uuid4())
        now = datetime.now().timestamp()
        conversation = Conversation(
            id=conv_id,
            title=title,
            created_at=now,
            updated_at=now,
            messages=[]
        )
        self._save_conversation(conversation)
        return conversation

    async def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        path = self._get_file_path(conversation_id)
        if not os.path.exists(path):
            return None
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return Conversation(**data)
        except Exception as e:
            print(f"Error loading conversation {conversation_id}: {e}")
            return None

    async def list_conversations(self) -> List[Dict]:
        conversations = []
        if not os.path.exists(self.storage_dir):
            return []
            
        for filename in os.listdir(self.storage_dir):
            if filename.endswith(".json"):
                try:
                    with open(os.path.join(self.storage_dir, filename), 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        conversations.append({
                            "id": data["id"],
                            "title": data.get("title", "New Chat"),
                            "created_at": data.get("created_at", 0),
                            "updated_at": data.get("updated_at", 0),
                            "message_count": len(data.get("messages", [])),
                            "tags": data.get("tags", [])
                        })
                except Exception as e:
                    print(f"Error loading conversation {filename}: {e}")
        
        # Sort by updated_at desc
        conversations.sort(key=lambda x: x["updated_at"], reverse=True)
        return conversations

    async def add_message(self, conversation_id: str, message: Dict[str, Any]):
        conversation = await self.get_conversation(conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")
        
        conversation.messages.append(message)
        conversation.updated_at = datetime.now().timestamp()
        
        # Auto-update title if it's the first user message
        if len(conversation.messages) <= 2 and conversation.title == "New Chat":
             # Try to find user message content
             content = message.get("content", "")
             role = message.get("role")
             
             if role == "user" and content and isinstance(content, str):
                 conversation.title = content[:30] + ("..." if len(content) > 30 else "")
        
        self._save_conversation(conversation)
        return conversation

    async def update_conversation_messages(self, conversation_id: str, messages: List[Dict[str, Any]]):
        conversation = await self.get_conversation(conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")
        
        conversation.messages = messages
        conversation.updated_at = datetime.now().timestamp()
        self._save_conversation(conversation)
        return conversation

    async def search_conversations(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Search for messages containing the query string across all conversations.
        Returns a list of match objects with context.
        """
        results = []
        query_lower = query.lower()
        
        # Sort conversations by updated_at desc (newest first)
        sorted_convs = sorted(
            self.conversations.values(), 
            key=lambda c: c.updated_at, 
            reverse=True
        )
        
        for conv in sorted_convs:
            for msg in conv.messages:
                content = str(msg.get("content", ""))
                if query_lower in content.lower():
                    results.append({
                        "conversation_id": conv.id,
                        "conversation_title": conv.title,
                        "message_role": msg.get("role"),
                        "content_snippet": content[:200] + "..." if len(content) > 200 else content,
                        "timestamp": msg.get("timestamp", conv.updated_at)
                    })
                    if len(results) >= limit:
                        return results
                        
        return results

    async def generate_tags(self, conversation_id: str):
        """
        Analyze conversation content and generate 3-5 tags using LLM.
        """
        conversation = await self.get_conversation(conversation_id)
        if not conversation:
            return
        
        # Heuristic: Only generate if not present or every 10 messages
        if conversation.tags and len(conversation.messages) % 10 != 0:
            return

        client = LLMFactory.get_client()
        if not client:
            return

        # Prepare context (last 20 messages to keep it focused but sufficient)
        messages = conversation.messages[-20:]
        text_content = ""
        for msg in messages:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            if isinstance(content, str):
                text_content += f"{role}: {content[:500]}\n"
        
        if not text_content.strip():
            return

        try:
            prompt = f"""
Analyze the following conversation snippet and generate 3 to 5 short, relevant tags (keywords) that describe the main topics, technologies, or concepts discussed.
Output format: JSON array of strings. Example: ["Python", "API Design", "Bug Fix"]
Do not output anything else.

Conversation:
{text_content}
"""
            completion = await client.chat.completions.create(
                model=LLMFactory.get_model(),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=100
            )
            
            response_text = completion.choices[0].message.content.strip()
            # Clean up potential markdown code blocks
            if response_text.startswith("```"):
                response_text = response_text.split("\n", 1)[1].rsplit("\n", 1)[0]
            
            new_tags = json.loads(response_text)
            if isinstance(new_tags, list):
                # Merge with existing tags (keep unique, max 8)
                existing_set = set(conversation.tags)
                for tag in new_tags:
                    if isinstance(tag, str):
                        existing_set.add(tag)
                
                conversation.tags = list(existing_set)[:8]
                self._save_conversation(conversation)
                print(f"[HistoryService] Updated tags for {conversation_id}: {conversation.tags}")
                
        except Exception as e:
            print(f"[HistoryService] Tag generation failed: {e}")

    async def update_title(self, conversation_id: str, title: str):
        conversation = await self.get_conversation(conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")
        conversation.title = title
        self._save_conversation(conversation)
        return conversation

    async def delete_conversation(self, conversation_id: str):
        path = self._get_file_path(conversation_id)
        if os.path.exists(path):
            os.remove(path)

    def _save_conversation(self, conversation: Conversation):
        path = self._get_file_path(conversation.id)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(conversation.model_dump_json(indent=2))

history_service = HistoryService()
