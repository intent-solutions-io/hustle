"""
Scout Team - Correct Agent Engine Entrypoint

The key is to expose a `query` method that Agent Engine can call.
"""

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import VertexAiSessionService
from agent import lead_scout_agent
import logging
import os
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
APP_NAME = os.getenv("APP_NAME", "hustle-scout-team")
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "hustleapp-production")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
AGENT_ENGINE_ID = os.getenv("AGENT_ENGINE_ID", "")

logger.info(
    f"Creating Agent Engine App",
    extra={
        "app_name": APP_NAME,
        "project_id": PROJECT_ID,
        "location": LOCATION,
    }
)


class ScoutTeamApp:
    """
    Agent Engine App wrapper for Scout Team

    This class exposes a `query` method that Agent Engine can call.
    """

    def __init__(self):
        # Create session service for Agent Engine
        self.session_service = VertexAiSessionService(
            project_id=PROJECT_ID,
            location=LOCATION,
            agent_engine_id=AGENT_ENGINE_ID
        )

        # Create Runner with Lead Scout multi-agent team
        self.runner = Runner(
            agent=lead_scout_agent,
            app_name=APP_NAME,
            session_service=self.session_service,
        )

        logger.info("✅ Scout Team App initialized")

    def query(
        self,
        message: str,
        user_id: str = "default",
        session_id: Optional[str] = None
    ) -> str:
        """
        Query the Scout team with a message.

        This method is called by Agent Engine when handling user requests.

        Args:
            message: User message
            user_id: User ID (for session tracking)
            session_id: Session ID (optional, will create new session if None)

        Returns:
            Agent response as string
        """
        logger.info(
            f"Query received",
            extra={
                "message": message,
                "user_id": user_id,
                "session_id": session_id
            }
        )

        try:
            # Run the agent
            # Use run_async for Agent Engine (it expects async responses)
            import asyncio

            # Get or create event loop
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            # Run agent asynchronously
            response = loop.run_until_complete(
                self.runner.run_async(
                    user_id=user_id,
                    session_id=session_id,
                    user_msg=message
                )
            )

            logger.info(
                f"Query completed",
                extra={
                    "user_id": user_id,
                    "session_id": session_id
                }
            )

            return response

        except Exception as e:
            logger.error(
                f"Query failed: {e}",
                extra={
                    "user_id": user_id,
                    "session_id": session_id,
                    "error": str(e)
                }
            )
            return f"I encountered an error: {str(e)}"


# Create the app instance
# ADK CLI will look for a variable called 'app'
app = ScoutTeamApp()

logger.info(
    "✅ App ready for Agent Engine deployment",
    extra={
        "app_name": APP_NAME,
        "project_id": PROJECT_ID,
        "location": LOCATION,
        "has_query_method": hasattr(app, "query"),
        "agent_type": "multi-agent-team"
    }
)
