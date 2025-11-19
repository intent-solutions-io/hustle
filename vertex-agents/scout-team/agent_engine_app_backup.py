"""
Scout Team - Agent Engine Entrypoint for ADK CLI Deployment

This file is REQUIRED by the 'adk deploy agent_engine' command.

When deploying with:
    adk deploy agent_engine scout-team \
      --project hustleapp-production \
      --region us-central1 \
      --staging_bucket gs://hustleapp-production-agent-staging

ADK CLI will:
1. Find this file (agent_engine_app.py)
2. Import the 'app' variable (must be a Runner instance)
3. Package everything into a Docker container
4. Upload to staging bucket
5. Deploy to Vertex AI Agent Engine
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
    f"Creating Runner for Agent Engine deployment via ADK CLI",
    extra={
        "app_name": APP_NAME,
        "project_id": PROJECT_ID,
        "location": LOCATION,
        "deployment_method": "adk-cli"
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
app = Runner(
    agent=lead_scout_agent,
    app_name=APP_NAME,
    session_service=session_service,
)

logger.info(
    "✅ Runner created - ready for ADK deployment to Vertex AI Agent Engine",
    extra={
        "app_name": APP_NAME,
        "project_id": PROJECT_ID,
        "location": LOCATION,
        "has_session_service": True,
        "agent_type": "multi-agent-team",
        "sub_agents": 4
    }
)

# The Agent Engine will call app.run_async() or app.run_live()
# when handling requests. The Runner manages the full execution lifecycle.
