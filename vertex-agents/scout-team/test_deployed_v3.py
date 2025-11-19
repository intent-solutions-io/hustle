"""
Test deployed Scout team on Vertex AI Agent Engine

Uses the correct Reasoning Engine API payload format.
Reference: https://cloud.google.com/vertex-ai/generative-ai/docs/reasoning-engine/query
"""

import requests
from google.auth import default
from google.auth.transport.requests import Request
import json


def test_deployed_agent():
    """Test the deployed Scout team using correct REST API format"""

    PROJECT_ID = "335713777643"
    LOCATION = "us-central1"
    REASONING_ENGINE_ID = "6962648586798497792"

    print("=" * 80)
    print("Testing Deployed Scout Team on Agent Engine")
    print("=" * 80)
    print()

    # Get credentials
    creds, project = default()
    creds.refresh(Request())

    # Construct endpoint
    endpoint = (
        f"https://{LOCATION}-aiplatform.googleapis.com/v1beta1/"
        f"projects/{PROJECT_ID}/locations/{LOCATION}/"
        f"reasoningEngines/{REASONING_ENGINE_ID}:query"
    )

    headers = {
        "Authorization": f"Bearer {creds.token}",
        "Content-Type": "application/json"
    }

    print(f"Endpoint: {endpoint}")
    print()

    # Test 1: Simple greeting
    print("Test 1: Simple Greeting")
    print("-" * 80)
    print("User: Hi Scout!")
    print()

    # According to Reasoning Engine API, the payload should be:
    # {
    #   "input": {
    #     <your custom input fields>
    #   }
    # }
    payload1 = {
        "input": {
            "message": "Hi Scout!",
            "user_id": "test_user",
            "session_id": "test_session_1"
        }
    }

    print(f"Payload: {json.dumps(payload1, indent=2)}")
    print()

    response1 = requests.post(endpoint, headers=headers, json=payload1, timeout=60)

    if response1.ok:
        result1 = response1.json()
        print(f"Response: {json.dumps(result1, indent=2)}")
        print()

        # Extract the actual response text if available
        if "output" in result1:
            print(f"Scout: {result1['output']}")
    else:
        print(f"❌ Error: {response1.status_code}")
        print(f"Response: {response1.text}")

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
            "user_id": "test_user",
            "session_id": "test_session_2"
        }
    }

    response2 = requests.post(endpoint, headers=headers, json=payload2, timeout=60)

    if response2.ok:
        result2 = response2.json()
        print(f"Response: {json.dumps(result2, indent=2)}")
        print()

        if "output" in result2:
            print(f"Scout: {result2['output']}")
    else:
        print(f"❌ Error: {response2.status_code}")
        print(f"Response: {response2.text}")

    print()
    print("=" * 80)
    print()

    # Test 3: Performance analysis
    print("Test 3: Performance Analysis")
    print("-" * 80)
    print("User: How is Emma doing this season?")
    print()

    payload3 = {
        "input": {
            "message": "How is Emma doing this season?",
            "user_id": "test_user",
            "session_id": "test_session_3"
        }
    }

    response3 = requests.post(endpoint, headers=headers, json=payload3, timeout=60)

    if response3.ok:
        result3 = response3.json()
        print(f"Response: {json.dumps(result3, indent=2)}")
        print()

        if "output" in result3:
            print(f"Scout: {result3['output']}")
    else:
        print(f"❌ Error: {response3.status_code}")
        print(f"Response: {response3.text}")

    print()
    print("=" * 80)
    print()

    # Test 4: Recruitment question
    print("Test 4: Recruitment Question")
    print("-" * 80)
    print("User: What does Emma need for D1 recruitment?")
    print()

    payload4 = {
        "input": {
            "message": "What does Emma need for D1 recruitment?",
            "user_id": "test_user",
            "session_id": "test_session_4"
        }
    }

    response4 = requests.post(endpoint, headers=headers, json=payload4, timeout=60)

    if response4.ok:
        result4 = response4.json()
        print(f"Response: {json.dumps(result4, indent=2)}")
        print()

        if "output" in result4:
            print(f"Scout: {result4['output']}")
    else:
        print(f"❌ Error: {response4.status_code}")
        print(f"Response: {response4.text}")

    print()
    print("=" * 80)
    print()

    print("✅ Deployed agent testing complete!")


if __name__ == "__main__":
    test_deployed_agent()
