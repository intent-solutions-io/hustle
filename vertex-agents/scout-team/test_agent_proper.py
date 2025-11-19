"""
Test the deployed Scout agent using the proper session-based workflow.

Based on the error message, Agent Engine exposes these methods:
- create_session
- get_session
- list_sessions
- delete_session
- async versions of above

The correct workflow is:
1. Call Runner.run_async(user_id, session_id, user_msg) via Python SDK
OR
2. Use the vertexai SDK's reasoning_engines module
"""

from vertexai.preview import reasoning_engines
import vertexai
import asyncio

# ORIGINAL deployment (this one is correct!)
PROJECT_ID = "hustleapp-production"
LOCATION = "us-central1"
REASONING_ENGINE_ID = "6962648586798497792"

print("=" * 80)
print("Testing Deployed Scout Team - ORIGINAL Deployment")
print(f"Resource: .../{REASONING_ENGINE_ID}")
print("=" * 80)
print()

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Create ReasoningEngine client
engine = reasoning_engines.ReasoningEngine(
    f"projects/335713777643/locations/{LOCATION}/reasoningEngines/{REASONING_ENGINE_ID}"
)

print(f"Available methods: {dir(engine)}")
print()
print("=" * 80)
print()

# The ReasoningEngine should have session methods
# Let's try creating a session
try:
    print("Test 1: Creating a session...")
    session_result = engine.create_session()
    print(f"Session created: {session_result}")

except AttributeError as e:
    print(f"❌ create_session not found: {e}")
    print()
    print("Available engine attributes:")
    for attr in dir(engine):
        if not attr.startswith('_'):
            print(f"  - {attr}")

except Exception as e:
    print(f"❌ Error: {e}")

print()
print("=" * 80)
print()
print("✅ Testing complete!")
