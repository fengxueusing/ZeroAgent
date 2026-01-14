import requests
import os

BASE_URL = "http://localhost:8000/api/v1"

def test_memory_api():
    # 1. List drafts
    print("Listing drafts...")
    response = requests.get(f"{BASE_URL}/history/drafts")
    if response.status_code != 200:
        print(f"Failed to list drafts: {response.text}")
        return
    
    drafts = response.json()
    print(f"Found {len(drafts)} drafts.")
    
    if not drafts:
        print("No drafts to test detail view.")
        # Create a dummy draft
        print("Creating dummy draft...")
        requests.post(f"{BASE_URL}/history/drafts", json={"filename": "test_draft.md", "content": "Hello World"})
        drafts = [{"filename": "test_draft.md"}]

    # 2. Get detail of the first draft
    first_draft = drafts[0]
    filename = first_draft['filename']
    print(f"Fetching details for: {filename}")
    
    response = requests.get(f"{BASE_URL}/history/drafts/{filename}")
    if response.status_code == 200:
        print("Success!")
        print(response.json())
    else:
        print(f"Failed to get draft detail: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_memory_api()
