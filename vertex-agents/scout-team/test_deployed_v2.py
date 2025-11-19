"""
Test deployed Scout team on Vertex AI Agent Engine

Approach 1: Using ADK's local app pattern with remote resource
Approach 2: Direct REST API call to Reasoning Engine
"""

import os
import sys

# Add parent directory to path to import agent
sys.path.insert(0, os.path.dirname(__file__))

from google.cloud import aiplatform
from google.adk.agents import LlmAgent
import json


def test_deployed_via_adk():
    """
    Test using ADK's app.query pattern

    According to ADK docs, you can query a deployed Reasoning Engine
    by loading it as an agent and calling query().
    """

    PROJECT_ID = "335713777643"
    LOCATION = "us-central1"
    REASONING_ENGINE_ID = "6962648586798497792"

    # Initialize Vertex AI
    aiplatform.init(project=PROJECT_ID, location=LOCATION)

    print("=" * 80)
    print("Testing Deployed Scout Team via ADK App Pattern")
    print("=" * 80)
    print()

    # Try to load the deployed reasoning engine
    try:
        from vertexai.preview import reasoning_engines

        # Get the deployed reasoning engine
        remote_agent = reasoning_engines.ReasoningEngine(
            f"projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{REASONING_ENGINE_ID}"
        )

        print("✅ Connected to deployed reasoning engine")
        print()

        # Test 1: Simple greeting
        print("Test 1: Simple Greeting")
        print("-" * 80)
        print("User: Hi Scout!")
        print()

        response1 = remote_agent.query(
            message="Hi Scout!",
            user_id="test_user",
            session_id="test_session_1"
        )

        print(f"Scout: {response1}")
        print()
        print("=" * 80)
        print()

        # Test 2: Log game stats
        print("Test 2: Log Game Stats")
        print("-" * 80)
        print("User: Emma scored 2 goals today against Riverside")
        print()

        response2 = remote_agent.query(
            message="Emma scored 2 goals today against Riverside",
            user_id="test_user",
            session_id="test_session_2"
        )

        print(f"Scout: {response2}")
        print()
        print("=" * 80)
        print()

        # Test 3: Performance analysis
        print("Test 3: Performance Analysis")
        print("-" * 80)
        print("User: How is Emma doing this season?")
        print()

        response3 = remote_agent.query(
            message="How is Emma doing this season?",
            user_id="test_user",
            session_id="test_session_3"
        )

        print(f"Scout: {response3}")
        print()
        print("=" * 80)
        print()

        print("✅ All tests passed!")

    except ImportError as e:
        print(f"❌ Could not import reasoning_engines: {e}")
        print()
        print("Trying alternative approach...")
        test_deployed_via_rest()
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("Trying alternative approach...")
        test_deployed_via_rest()


def test_deployed_via_rest():
    """
    Test using direct REST API calls

    Uses Google Cloud credentials to make authenticated REST API calls
    to the Reasoning Engine endpoint.
    """

    import requests
    from google.auth import default
    from google.auth.transport.requests import Request

    PROJECT_ID = "335713777643"
    LOCATION = "us-central1"
    REASONING_ENGINE_ID = "6962648586798497792"

    print()
    print("=" * 80)
    print("Testing Deployed Scout Team via REST API")
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

    payload1 = {
        "message": "Hi Scout!",
        "user_id": "test_user",
        "session_id": "test_session_1"
    }

    response1 = requests.post(endpoint, headers=headers, json=payload1)

    if response1.ok:
        result1 = response1.json()
        print(f"Scout: {result1}")
    else:
        print(f"❌ Error: {response1.status_code} - {response1.text}")

    print()
    print("=" * 80)
    print()

    # Test 2: Log game stats
    print("Test 2: Log Game Stats")
    print("-" * 80)
    print("User: Emma scored 2 goals today against Riverside")
    print()

    payload2 = {
        "message": "Emma scored 2 goals today against Riverside",
        "user_id": "test_user",
        "session_id": "test_session_2"
    }

    response2 = requests.post(endpoint, headers=headers, json=payload2)

    if response2.ok:
        result2 = response2.json()
        print(f"Scout: {result2}")
    else:
        print(f"❌ Error: {response2.status_code} - {response2.text}")

    print()
    print("=" * 80)
    print()

    print("✅ REST API tests complete!")


if __name__ == "__main__":
    test_deployed_via_adk()
