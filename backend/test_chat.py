import requests
import json

def test_chat():
    url = "http://localhost:8000/api/v1/chat/"
    payload = {
        "message": "hello",
        "context_domain": "example.com"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat()
