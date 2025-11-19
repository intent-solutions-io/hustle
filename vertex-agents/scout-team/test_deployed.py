"""Test deployed Scout team on Agent Engine"""
from google.adk.remote_app import AgentEngineApp
import asyncio

async def test_deployed_agent():
    """Test the deployed Scout team"""

    # Connect to deployed agent
    app = AgentEngineApp(
        resource_name="projects/335713777643/locations/us-central1/reasoningEngines/6962648586798497792"
    )

    print("=" * 80)
    print("Testing Deployed Scout Team on Agent Engine")
    print("=" * 80)
    print()

    # Test 1: Simple greeting
    print("Test 1: Simple Greeting")
    print("User: Hi Scout!")
    print()

    response = await app.query_async(
        user_id="test_user",
        session_id="test_session_deployed",
        message="Hi Scout!"
    )

    print(f"Scout: {response}")
    print()
    print("=" * 80)
    print()

    # Test 2: Log game stats
    print("Test 2: Log Game Stats")
    print("User: Emma scored 2 goals today against Riverside")
    print()

    response = await app.query_async(
        user_id="test_user",
        session_id="test_session_deployed",
        message="Emma scored 2 goals today against Riverside"
    )

    print(f"Scout: {response}")
    print()
    print("=" * 80)

    print()
    print("✅ Deployed agent is working!")

if __name__ == "__main__":
    asyncio.run(test_deployed_agent())
