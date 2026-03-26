"""
Test the deployed Scout agent - CORRECT Agent Engine API

Based on official ADK documentation:
https://google.github.io/adk-docs/deploy/agent-engine/

Agent Engine REST API uses:
1. :query endpoint with class_method parameter
2. async_create_session for creating sessions
3. async_stream_query for streaming queries
"""

import requests
from google.auth import default
from google.auth.transport.requests import Request
import json
import uuid

# Deployed Scout Team
PROJECT_ID = "335713777643"
LOCATION = "us-central1"
REASONING_ENGINE_ID = "6962648586798497792"

# Get auth token
creds, _ = default()
creds.refresh(Request())

# Base endpoint
base_url = f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{REASONING_ENGINE_ID}"

headers = {
    "Authorization": f"Bearer {creds.token}",
    "Content-Type": "application/json"
}

print("=" * 80)
print("Testing Deployed Scout Team - CORRECT Agent Engine API")
print("=" * 80)
print()

# Step 1: Create session
print("Step 1: Creating session...")
user_id = "test_user"
session_id = f"session_{uuid.uuid4().hex[:8]}"

create_session_payload = {
    "class_method": "async_create_session",
    "input": {
        "user_id": user_id,
        "session_id": session_id
    }
}

try:
    response = requests.post(
        f"{base_url}:query",
        headers=headers,
        json=create_session_payload,
        timeout=30
    )
    print(f"Status: {response.status_code}")

    if response.ok:
        result = response.json()
        print(f"✅ Session created: {json.dumps(result, indent=2)}")
    else:
        print(f"❌ Error: {response.text}")
        exit(1)

except Exception as e:
    print(f"❌ Exception: {e}")
    exit(1)

print()
print("=" * 80)
print()

# Step 2: Send query using stream
print("Step 2: Sending query to agent...")
print(f"User: Hi Scout!")
print()

query_payload = {
    "class_method": "async_stream_query",
    "input": {
        "user_id": user_id,
        "session_id": session_id,
        "message": "Hi Scout!"
    }
}

try:
    response = requests.post(
        f"{base_url}:streamQuery?alt=sse",
        headers=headers,
        json=query_payload,
        timeout=60,
        stream=True
    )

    print(f"Status: {response.status_code}")

    if response.ok:
        print("Scout response:")
        print("-" * 80)

        # Stream SSE events
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data = line_str[6:]  # Remove 'data: ' prefix
                    try:
                        event = json.loads(data)
                        print(f"Event: {json.dumps(event, indent=2)}")
                    except:
                        print(f"Raw: {data}")

        print("-" * 80)
    else:
        print(f"❌ Error: {response.text}")

except Exception as e:
    print(f"❌ Exception: {e}")

print()
print("=" * 80)
print()

# Step 3: Test with stat logging
print("Step 3: Log game stats...")
print(f"User: Emma scored 2 goals today against Riverside")
print()

query_payload_2 = {
    "class_method": "async_stream_query",
    "input": {
        "user_id": user_id,
        "session_id": session_id,
        "message": "Emma scored 2 goals today against Riverside"
    }
}

try:
    response = requests.post(
        f"{base_url}:streamQuery?alt=sse",
        headers=headers,
        json=query_payload_2,
        timeout=60,
        stream=True
    )

    print(f"Status: {response.status_code}")

    if response.ok:
        print("Scout response:")
        print("-" * 80)

        # Stream SSE events
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data = line_str[6:]
                    try:
                        event = json.loads(data)
                        # Print just the text responses
                        if 'text' in event:
                            print(f"Scout: {event['text']}")
                        else:
                            print(f"Event: {json.dumps(event, indent=2)}")
                    except:
                        print(f"Raw: {data}")

        print("-" * 80)
    else:
        print(f"❌ Error: {response.text}")

except Exception as e:
    print(f"❌ Exception: {e}")

print()
print("=" * 80)
print()
print("✅ Testing complete!")
