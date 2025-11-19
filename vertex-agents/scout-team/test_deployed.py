"""
Test deployed Scout team on Vertex AI Agent Engine

Uses Vertex AI Reasoning Engine API to query the deployed multi-agent system.
Resource: projects/335713777643/locations/us-central1/reasoningEngines/6962648586798497792
"""

from google.cloud import aiplatform
from google.cloud.aiplatform_v1beta1 import ReasoningEngineServiceClient
from google.cloud.aiplatform_v1beta1.types import QueryReasoningEngineRequest
import json


def test_deployed_agent():
    """Test the deployed Scout team using Reasoning Engine API"""

    # Initialize Vertex AI
    PROJECT_ID = "335713777643"
    LOCATION = "us-central1"
    REASONING_ENGINE_ID = "6962648586798497792"

    aiplatform.init(project=PROJECT_ID, location=LOCATION)

    # Create Reasoning Engine client
    client = ReasoningEngineServiceClient(
        client_options={"api_endpoint": f"{LOCATION}-aiplatform.googleapis.com"}
    )

    # Construct resource name
    resource_name = (
        f"projects/{PROJECT_ID}/locations/{LOCATION}/"
        f"reasoningEngines/{REASONING_ENGINE_ID}"
    )

    print("=" * 80)
    print("Testing Deployed Scout Team on Agent Engine")
    print("=" * 80)
    print(f"Resource: {resource_name}")
    print()

    # Test 1: Simple greeting
    print("Test 1: Simple Greeting")
    print("-" * 80)
    print("User: Hi Scout!")
    print()

    request1 = QueryReasoningEngineRequest(
        name=resource_name,
        input={
            "message": "Hi Scout!",
            "session_id": "test_session_deployed_1",
            "user_id": "test_user",
        },
    )

    try:
        response1 = client.query_reasoning_engine(request=request1)
        print(f"Scout: {response1.output}")
        print()
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

    request2 = QueryReasoningEngineRequest(
        name=resource_name,
        input={
            "message": "Emma scored 2 goals today against Riverside",
            "session_id": "test_session_deployed_2",
            "user_id": "test_user",
        },
    )

    try:
        response2 = client.query_reasoning_engine(request=request2)
        print(f"Scout: {response2.output}")
        print()
    except Exception as e:
        print(f"❌ Error: {e}")
        print()

    print("=" * 80)
    print()

    # Test 3: Performance analysis
    print("Test 3: Performance Analysis")
    print("-" * 80)
    print("User: How is Emma doing this season?")
    print()

    request3 = QueryReasoningEngineRequest(
        name=resource_name,
        input={
            "message": "How is Emma doing this season?",
            "session_id": "test_session_deployed_3",
            "user_id": "test_user",
        },
    )

    try:
        response3 = client.query_reasoning_engine(request=request3)
        print(f"Scout: {response3.output}")
        print()
    except Exception as e:
        print(f"❌ Error: {e}")
        print()

    print("=" * 80)
    print()

    # Test 4: Recruitment question
    print("Test 4: Recruitment Question")
    print("-" * 80)
    print("User: What does Emma need for D1 recruitment?")
    print()

    request4 = QueryReasoningEngineRequest(
        name=resource_name,
        input={
            "message": "What does Emma need for D1 recruitment?",
            "session_id": "test_session_deployed_4",
            "user_id": "test_user",
        },
    )

    try:
        response4 = client.query_reasoning_engine(request=request4)
        print(f"Scout: {response4.output}")
        print()
    except Exception as e:
        print(f"❌ Error: {e}")
        print()

    print("=" * 80)
    print()
    print("✅ Deployed agent testing complete!")


if __name__ == "__main__":
    test_deployed_agent()
