"""Test the newly deployed Scout agent with query() method"""

import requests
from google.auth import default
from google.auth.transport.requests import Request
import json

# New deployment
PROJECT_ID = "335713777643"
LOCATION = "us-central1"
REASONING_ENGINE_ID = "4719644866135457792"

# Get credentials
creds, _ = default()
creds.refresh(Request())

# Build endpoint
endpoint = (
    f"https://{LOCATION}-aiplatform.googleapis.com/v1/"
    f"projects/{PROJECT_ID}/locations/{LOCATION}/"
    f"reasoningEngines/{REASONING_ENGINE_ID}:query"
)

headers = {
    "Authorization": f"Bearer {creds.token}",
    "Content-Type": "application/json"
}

print("=" * 80)
print("Testing Newly Deployed Scout Team (with query() method)")
print("=" * 80)
print()

# Test 1: Simple greeting
print("Test 1: Simple Greeting")
print("-" * 80)
print("User: Hi Scout!")
print()

payload1 = {
    "input": {
        "message": "Hi Scout!",
        "user_id": "test_user"
    }
}

try:
    response1 = requests.post(endpoint, headers=headers, json=payload1, timeout=60)
    print(f"Status Code: {response1.status_code}")

    if response1.ok:
        result1 = response1.json()
        print(f"Response: {json.dumps(result1, indent=2)}")

        if "output" in result1:
            print(f"\nScout: {result1['output']}")
    else:
        print(f"Error: {response1.text}")

except Exception as e:
    print(f"❌ Error: {e}")

print()
print("=" * 80)
print()

# Test 2: Log game stats
print("Test 2: Log Game Stats")
print("-" * 80)
print("User: Emma scored 2 goals today against Riverside")
print()

payload2 = {
    "input": {
        "message": "Emma scored 2 goals today against Riverside",
        "user_id": "test_user"
    }
}

try:
    response2 = requests.post(endpoint, headers=headers, json=payload2, timeout=60)
    print(f"Status Code: {response2.status_code}")

    if response2.ok:
        result2 = response2.json()
        print(f"Response: {json.dumps(result2, indent=2)}")

        if "output" in result2:
            print(f"\nScout: {result2['output']}")
    else:
        print(f"Error: {response2.text}")

except Exception as e:
    print(f"❌ Error: {e}")

print()
print("=" * 80)
print()
print("✅ Testing complete!")
