import requests
import os

# Create a dummy file if not exists
if not os.path.exists("test_zero.py"):
    with open("test_zero.py", "w") as f:
        f.write("print('Hello Zero Engine')")

url = "http://localhost:8000/api/v1/chat/upload"
files = {'file': ('test_zero.py', open('test_zero.py', 'rb'), 'text/x-python')}

print(f"Uploading to {url}...")
try:
    response = requests.post(url, files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
