"""
Local testing for Hustle Scout Agent
Following Google ADK testing standards from https://google.github.io/adk-docs/
"""

import asyncio
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from agent import root_agent


# ============================================================================
# LOCAL TESTING UTILITIES
# ============================================================================

async def test_scout_agent():
    """
    Test Scout agent locally before deployment.

    Following ADK pattern:
    1. Create Runner with InMemorySessionService
    2. Create test session
    3. Send test queries
    4. Print responses
    """

    print("=" * 80)
    print("HUSTLE SCOUT AGENT - LOCAL TESTING")
    print("=" * 80)
    print()

    # Step 1: Create runner with session service
    print("Initializing Scout agent...")
    session_service = InMemorySessionService()
    runner = Runner(
        app_name="hustle_scout",
        agent=root_agent,
        session_service=session_service,
    )
    print("✅ Runner initialized")
    print()

    # Step 2: Test scenarios
    test_scenarios = [
        {
            "name": "Simple Greeting",
            "message": "Hi Scout!",
            "expected": "Should introduce itself as personal statistician",
        },
        {
            "name": "Log Game Stats",
            "message": "Emma scored 2 goals and 1 assist today against Riverside High in a league game",
            "expected": "Should log stats and celebrate achievement",
        },
        {
            "name": "Get Player Stats",
            "message": "How is Emma doing this season?",
            "expected": "Should fetch and present season statistics",
        },
        {
            "name": "Recruitment Insights",
            "message": "What does Emma need for D1 recruitment?",
            "expected": "Should provide recruitment readiness analysis",
        },
        {
            "name": "Clarifying Question",
            "message": "My daughter scored 3 goals today",
            "expected": "Should ask for player name and game details",
        },
    ]

    user_id = "test_user"
    session_id = "test_session_001"

    for i, scenario in enumerate(test_scenarios, 1):
        print(f"Test Scenario {i}/{len(test_scenarios)}: {scenario['name']}")
        print(f"Expected: {scenario['expected']}")
        print("-" * 80)
        print(f"User: {scenario['message']}")
        print()

        # Create Content message
        user_message = types.Content(
            role="user",
            parts=[types.Part(text=scenario['message'])]
        )

        # Run agent and collect response
        print("Scout: ", end="", flush=True)
        response_text = ""

        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message
        ):
            # Extract text from events
            if hasattr(event, 'content') and event.content:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        print(part.text, end="", flush=True)
                        response_text += part.text

        print()
        print()
        print("=" * 80)
        print()

        # Small delay between tests
        await asyncio.sleep(1)

    print("✅ All test scenarios complete!")
    print()
    print("Next steps:")
    print("1. If tests look good, deploy to Agent Engine: python deploy.py")
    print("2. Integrate with Next.js frontend")
    print("3. Test end-to-end via web UI")


# ============================================================================
# INTERACTIVE TEST MODE
# ============================================================================

async def interactive_test():
    """
    Interactive mode for manual testing.
    Type messages and see Scout's responses in real-time.
    """

    print("=" * 80)
    print("HUSTLE SCOUT AGENT - INTERACTIVE TEST MODE")
    print("=" * 80)
    print()
    print("Type messages to chat with Scout. Type 'exit' or 'quit' to stop.")
    print()

    # Initialize runner
    session_service = InMemorySessionService()
    runner = Runner(
        app_name="hustle_scout",
        agent=root_agent,
        session_service=session_service,
    )

    user_id = "interactive_user"
    session_id = "interactive_session"

    print("Scout: Hi! I'm Scout, your personal sports statistician. How can I help you today?")
    print()

    while True:
        # Get user input
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nExiting interactive mode...")
            break

        if not user_input:
            continue

        if user_input.lower() in ['exit', 'quit', 'q']:
            print("\nExiting interactive mode...")
            break

        # Create message
        user_message = types.Content(
            role="user",
            parts=[types.Part(text=user_input)]
        )

        # Get response
        print("Scout: ", end="", flush=True)

        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message
        ):
            if hasattr(event, 'content') and event.content:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        print(part.text, end="", flush=True)

        print()
        print()


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import sys

    mode = sys.argv[1] if len(sys.argv) > 1 else "test"

    if mode == "interactive":
        asyncio.run(interactive_test())
    else:
        asyncio.run(test_scout_agent())
