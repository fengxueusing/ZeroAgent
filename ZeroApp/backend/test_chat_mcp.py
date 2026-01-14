import requests
import json

def test_chat():
    url = "http://localhost:8000/api/v1/agent/chat"
    # payload = {
    #     "messages": [
    #         {"role": "user", "content": "Check if there are any docker containers running, and list them."}
    #     ]
    # }
    payload = {
        "messages": [
            {"role": "user", "content": "Search for repositories related to 'mcp' on GitHub."}
        ]
    }
    
    try:
        print(f"Sending request to {url}...")
        # Set a long timeout
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        
        print("Response Status:", response.status_code)
        print("Response Content:", json.dumps(response.json(), indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response:
            print("Error Details:", e.response.text)

if __name__ == "__main__":
    test_chat()
