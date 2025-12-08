import requests
import json
import os
import sys
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL")

if not API_URL:
    print("Error: API_URL is not set in environment")
    sys.exit(1)

print("API_URL:", API_URL)

payload = {
    "model": "deepseek-r1:1.5b",
    "messages": [{"role": "user", "content": "forming an ordered data from unordered data"}],
    "stream": True
}

headers = {"Content-Type": "application/json"}

try:
    response = requests.post(API_URL, json=payload, headers=headers, stream=True, timeout=60)
except requests.RequestException as e:
    print("Request failed:", e)
    sys.exit(1)

if response.status_code == 200:
    print("Connected to Ollama successfully!")
    for raw_line in response.iter_lines(decode_unicode=True):
        if not raw_line:
            continue

        line = raw_line.strip()
        
        try:
            json_data = json.loads(line)
            # Print only the content (message part)
            if "message" in json_data:
                content = json_data.get("message", {}).get("content", "")
                if content:
                    print(content, end="", flush=True)
            # Check if stream is done
            if json_data.get("done", False):
                print("\n\nStream finished")
                break
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            continue
else:
    print(f"Error: {response.status_code}")
    print(f"Response: {response.text}")
    print("\nMake sure:")
    print("1. Ollama server is running: ollama serve")
    print("2. Model deepseek-r1:1.5b is installed: ollama pull deepseek-r1:1.5b")

