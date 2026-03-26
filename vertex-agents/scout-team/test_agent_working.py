"""
Test the deployed Scout agent - WORKING VERSION

The agent is deployed and create_session requires user_id parameter.
"""

from vertexai.preview import reasoning_engines
import vertexai
import uuid

# ORIGINAL deployment
PROJECT_ID = "hustleapp-production"
LOCATION = "us-central1"
REASONING_ENGINE_ID = "6962648586798497792"

print("=" * 80)
print("Testing Deployed Scout Team - Session-Based Workflow")
print("=" * 80)
print()

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Create ReasoningEngine client
engine = reasoning_engines.ReasoningEngine(
    f"projects/335713777643/locations/{LOCATION}/reasoningEngines/{REASONING_ENGINE_ID}"
)

# Test 1: Create session with user_id
print("Test 1: Creating a session with user_id...")
try:
    session_id = f"test_session_{uuid.uuid4().hex[:8]}"
    user_id = "test_user"

    print(f"   user_id: {user_id}")
    print(f"   session_id: {session_id}")
    print()

    session_result = engine.create_session(user_id=user_id, session_id=session_id)
    print(f"✅ Session created: {session_result}")

except Exception as e:
    print(f"❌ Error creating session: {e}")

print()
print("=" * 80)
print()

# Test 2: Get session
print("Test 2: Getting the session...")
try:
    get_result = engine.get_session(user_id=user_id, session_id=session_id)
    print(f"✅ Session retrieved: {get_result}")

except Exception as e:
    print(f"❌ Error getting session: {e}")

print()
print("=" * 80)
print()

# Test 3: List sessions
print("Test 3: Listing sessions...")
try:
    list_result = engine.list_sessions(user_id=user_id)
    print(f"✅ Sessions listed: {list_result}")

except Exception as e:
    print(f"❌ Error listing sessions: {e}")

print()
print("=" * 80)
print()
print("✅ Testing complete!")
print()
print("Next step: Figure out how to actually SEND MESSAGES to the agent")
print("The session methods exist, but we need to find how to:")
print("  1. Send a message to the agent within a session")
print("  2. Get the agent's response")
