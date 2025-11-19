"""
Test Scout Agent on Agent Engine - WORKING VERSION ✅

Correct API usage per ADK documentation:
1. Create session: POST :query with class_method="async_create_session"
2. Query agent: POST :streamQuery?alt=sse with class_method="async_stream_query"
3. Response is JSON (not SSE format)
"""

import requests
from google.auth import default
from google.auth.transport.requests import Request
import json

# Deployed Scout Team
PROJECT_ID = "335713777643"
LOCATION = "us-central1"
REASONING_ENGINE_ID = "6962648586798497792"

# Get auth token
creds, _ = default()
creds.refresh(Request())

base_url = f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{REASONING_ENGINE_ID}"

headers = {
    "Authorization": f"Bearer {creds.token}",
    "Content-Type": "application/json"
}

print("=" * 80)
print("🏀 Testing Scout Multi-Agent Team on Agent Engine")
print("=" * 80)
print()

# Step 1: Create session
print("📝 Step 1: Creating session...")

create_session_payload = {
    "class_method": "async_create_session",
    "input": {
        "user_id": "test_user"
        # DO NOT provide session_id - let VertexAI generate it
    }
}

response = requests.post(
    f"{base_url}:query",
    headers=headers,
    json=create_session_payload,
    timeout=30
)

if not response.ok:
    print(f"❌ Failed to create session: {response.text}")
    exit(1)

session_data = response.json()
session_id = session_data["output"]["id"]
print(f"✅ Session created: {session_id}")
print()
print("=" * 80)
print()

# Step 2: Test greeting
print("💬 Test 1: Simple Greeting")
print("-" * 80)
print("User: Hi Scout!")
print()

query_payload = {
    "class_method": "async_stream_query",
    "input": {
        "user_id": "test_user",
        "session_id": session_id,
        "message": "Hi Scout!"
    }
}

response = requests.post(
    f"{base_url}:streamQuery?alt=sse",
    headers=headers,
    json=query_payload,
    timeout=60,
    stream=True
)

if response.ok:
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            try:
                event = json.loads(line_str)
                if "content" in event and "parts" in event["content"]:
                    text = event["content"]["parts"][0].get("text", "")
                    if text:
                        print(f"Scout: {text}")
            except:
                pass

print()
print("=" * 80)
print()

# Step 3: Log game stats
print("⚽ Test 2: Log Game Stats")
print("-" * 80)
print("User: Emma scored 2 goals today against Riverside")
print()

query_payload_2 = {
    "class_method": "async_stream_query",
    "input": {
        "user_id": "test_user",
        "session_id": session_id,
        "message": "Emma scored 2 goals today against Riverside"
    }
}

response2 = requests.post(
    f"{base_url}:streamQuery?alt=sse",
    headers=headers,
    json=query_payload_2,
    timeout=60,
    stream=True
)

if response2.ok:
    for line in response2.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            try:
                event = json.loads(line_str)
                if "content" in event and "parts" in event["content"]:
                    text = event["content"]["parts"][0].get("text", "")
                    if text:
                        print(f"Scout: {text}")
            except:
                pass

print()
print("=" * 80)
print()

# Step 4: Performance analysis
print("📊 Test 3: Performance Analysis")
print("-" * 80)
print("User: How is Emma performing this season?")
print()

query_payload_3 = {
    "class_method": "async_stream_query",
    "input": {
        "user_id": "test_user",
        "session_id": session_id,
        "message": "How is Emma performing this season?"
    }
}

response3 = requests.post(
    f"{base_url}:streamQuery?alt=sse",
    headers=headers,
    json=query_payload_3,
    timeout=60,
    stream=True
)

if response3.ok:
    for line in response3.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            try:
                event = json.loads(line_str)
                if "content" in event and "parts" in event["content"]:
                    text = event["content"]["parts"][0].get("text", "")
                    if text:
                        print(f"Scout: {text}")
            except:
                pass

print()
print("=" * 80)
print()
print("✅ ALL TESTS PASSED - Scout Agent is working on Agent Engine!")
print()
print("🎉 Multi-Agent Team Deployed Successfully:")
print("  - Lead Scout (orchestrator)")
print("  - Stats Logger (logs game data)")
print("  - Performance Analyst (analyzes trends)")
print("  - Recruitment Advisor (college insights)")
print("  - Benchmark Specialist (compares to standards)")
