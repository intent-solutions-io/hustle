"""
Test deployed Scout team on Vertex AI Agent Engine

Uses session-based API since that's what Agent Engine exposes.

According to the error message, available methods are:
- create_session
- get_session
- list_sessions
- delete_session
- async_* versions of above

This means we need to:
1. Create a session
2. Add messages to the session
3. Get the agent's response
"""

import requests
from google.auth import default
from google.auth.transport.requests import Request
import json
import time


class AgentEngineClient:
    """Client for interacting with deployed Agent Engine agents"""

    def __init__(self, project_id: str, location: str, reasoning_engine_id: str):
        self.project_id = project_id
        self.location = location
        self.reasoning_engine_id = reasoning_engine_id

        # Get credentials
        self.creds, _ = default()
        self.creds.refresh(Request())

        # Base endpoint
        self.base_endpoint = (
            f"https://{location}-aiplatform.googleapis.com/v1beta1/"
            f"projects/{project_id}/locations/{location}/"
            f"reasoningEngines/{reasoning_engine_id}"
        )

        self.headers = {
            "Authorization": f"Bearer {self.creds.token}",
            "Content-Type": "application/json"
        }

    def create_session(self) -> dict:
        """Create a new session"""
        endpoint = f"{self.base_endpoint}:createSession"

        payload = {
            "input": {}
        }

        response = requests.post(endpoint, headers=self.headers, json=payload, timeout=30)

        if response.ok:
            return response.json()
        else:
            raise Exception(f"Failed to create session: {response.status_code} - {response.text}")

    def get_session(self, session_id: str) -> dict:
        """Get session details"""
        endpoint = f"{self.base_endpoint}:getSession"

        payload = {
            "input": {
                "session_id": session_id
            }
        }

        response = requests.post(endpoint, headers=self.headers, json=payload, timeout=30)

        if response.ok:
            return response.json()
        else:
            raise Exception(f"Failed to get session: {response.status_code} - {response.text}")

    def add_session_to_memory(self, session_id: str, message: str) -> dict:
        """Add a message to session memory"""
        endpoint = f"{self.base_endpoint}:addSessionToMemory"

        payload = {
            "input": {
                "session_id": session_id,
                "message": message
            }
        }

        response = requests.post(endpoint, headers=self.headers, json=payload, timeout=60)

        if response.ok:
            return response.json()
        else:
            raise Exception(f"Failed to add to memory: {response.status_code} - {response.text}")

    def search_memory(self, session_id: str, query: str) -> dict:
        """Search session memory"""
        endpoint = f"{self.base_endpoint}:searchMemory"

        payload = {
            "input": {
                "session_id": session_id,
                "query": query
            }
        }

        response = requests.post(endpoint, headers=self.headers, json=payload, timeout=30)

        if response.ok:
            return response.json()
        else:
            raise Exception(f"Failed to search memory: {response.status_code} - {response.text}")

    def query_agent(self, message: str, session_id: str = None) -> dict:
        """
        Query the agent with a message.

        This wraps the session-based workflow:
        1. Create session if needed
        2. Add message to session
        3. Get response
        """
        # Create session if not provided
        if session_id is None:
            session_result = self.create_session()
            session_id = session_result.get("session_id")
            print(f"   Created session: {session_id}")

        # Add message to session (this should trigger agent response)
        result = self.add_session_to_memory(session_id, message)

        return result


def test_deployed_agent():
    """Test the deployed Scout team"""

    PROJECT_ID = "335713777643"
    LOCATION = "us-central1"
    REASONING_ENGINE_ID = "6962648586798497792"

    print("=" * 80)
    print("Testing Deployed Scout Team on Agent Engine")
    print("=" * 80)
    print()

    client = AgentEngineClient(PROJECT_ID, LOCATION, REASONING_ENGINE_ID)

    # Test 1: Simple greeting
    print("Test 1: Simple Greeting")
    print("-" * 80)
    print("User: Hi Scout!")
    print()

    try:
        response1 = client.query_agent("Hi Scout!")
        print(f"Response: {json.dumps(response1, indent=2)}")
        print()

        if "output" in response1:
            print(f"Scout: {response1['output']}")
        elif "response" in response1:
            print(f"Scout: {response1['response']}")

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

    try:
        response2 = client.query_agent("Emma scored 2 goals today against Riverside")
        print(f"Response: {json.dumps(response2, indent=2)}")
        print()

        if "output" in response2:
            print(f"Scout: {response2['output']}")
        elif "response" in response2:
            print(f"Scout: {response2['response']}")

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

    try:
        response3 = client.query_agent("How is Emma doing this season?")
        print(f"Response: {json.dumps(response3, indent=2)}")
        print()

        if "output" in response3:
            print(f"Scout: {response3['output']}")
        elif "response" in response3:
            print(f"Scout: {response3['response']}")

    except Exception as e:
        print(f"❌ Error: {e}")

    print()
    print("=" * 80)
    print()

    print("✅ Deployed agent testing complete!")


if __name__ == "__main__":
    test_deployed_agent()
