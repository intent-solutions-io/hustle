"""
Scout Team - Agent Engine Entrypoint for ADK CLI Deployment

ADK CLI expects an `app` variable that is a Runner instance.
The Runner automatically exposes query methods to Agent Engine.
"""

from google.adk.runners import Runner
from google.adk.sessions import VertexAiSessionService
from agent import lead_scout_agent
import logging
import os

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
AGENT_ENGINE_ID = os.getenv("AGENT_ENGINE_ID", "")  # Set by Agent Engine at runtime

logger.info(
    f"Creating Agent Engine App",
    extra={
        "app_name": APP_NAME,
        "project_id": PROJECT_ID,
        "location": LOCATION,
    }
)

# Create session service for Agent Engine
session_service = VertexAiSessionService(
    project_id=PROJECT_ID,
    location=LOCATION,
    agent_engine_id=AGENT_ENGINE_ID
)
logger.info("✅ Session service initialized")

# Create Runner with Lead Scout multi-agent team
# ADK CLI expects a Runner instance named 'app'
app = Runner(
    agent=lead_scout_agent,
    app_name=APP_NAME,
    session_service=session_service,
)

logger.info(
    "✅ Runner created - ready for Agent Engine deployment",
    extra={
        "app_name": APP_NAME,
        "project_id": PROJECT_ID,
        "location": LOCATION,
        "has_session_service": True,
        "agent_type": "multi-agent-team",
        "sub_agents": 4
    }
)

# The Runner automatically exposes methods to Agent Engine:
# - create_session
# - get_session
# - list_sessions
# - delete_session
# - async versions of above
#
# To call the agent, use session-based workflow:
# 1. Create a session
# 2. Use run_async(user_id, session_id, user_msg)
# 3. Get response from the agent
