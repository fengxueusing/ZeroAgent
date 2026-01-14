import asyncio
import os
import shutil
from app.services.history_service import HistoryService

async def test_history_flow():
    print("Testing History Service...")
    
    # Setup test dir
    test_dir = "data/test_conversations"
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    
    service = HistoryService(storage_dir=test_dir)
    
    # 1. Create Conversation
    conv = await service.create_conversation("Test Chat")
    print(f"Created conversation: {conv.id} - {conv.title}")
    assert conv.title == "Test Chat"
    assert len(conv.messages) == 0
    
    # 2. Add Message
    msg = {"role": "user", "content": "Hello Zero"}
    updated_conv = await service.add_message(conv.id, msg)
    print(f"Added message. Count: {len(updated_conv.messages)}")
    assert len(updated_conv.messages) == 1
    assert updated_conv.messages[0]["content"] == "Hello Zero"
    
    # 3. Test Auto-Title (simulate new chat)
    conv2 = await service.create_conversation("New Chat")
    msg2 = {"role": "user", "content": "This is a long message to test auto title generation feature"}
    updated_conv2 = await service.add_message(conv2.id, msg2)
    print(f"Auto-title test: {updated_conv2.title}")
    assert updated_conv2.title != "New Chat"
    
    # 4. Test Update Messages (Bulk)
    new_msgs = [
        {"role": "user", "content": "A"},
        {"role": "assistant", "content": "B"}
    ]
    updated_conv3 = await service.update_conversation_messages(conv.id, new_msgs)
    print(f"Updated messages. Count: {len(updated_conv3.messages)}")
    assert len(updated_conv3.messages) == 2
    assert updated_conv3.messages[1]["content"] == "B"
    
    # 5. List Conversations
    conversations = await service.list_conversations()
    print(f"Total conversations: {len(conversations)}")
    assert len(conversations) == 2
    
    # Cleanup
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    
    print("All tests passed!")

if __name__ == "__main__":
    asyncio.run(test_history_flow())
