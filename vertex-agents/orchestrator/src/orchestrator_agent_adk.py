"""
Hustle Operations Manager - ADK-Based Orchestrator Agent
Vertex AI ADK Agent with native A2A Protocol Support

This is the ADK SDK implementation that will replace the custom implementation
in orchestrator_agent.py. Uses google-adk package for simplified agent development.
"""

import uuid
import time
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

from google.adk import Agent, Runner
from google.adk.tools import FunctionTool
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part
from a2a.client import A2AClient
from google.cloud import firestore
from google.cloud import logging as cloud_logging


# Configure logging
logging_client = cloud_logging.Client()
logging_client.setup_logging()
logger = logging.getLogger(__name__)


@dataclass
class AgentResponse:
    """Standardized agent response structure"""
    agent_name: str
    status: str  # success | failed | timeout
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    duration_ms: int = 0


# Define tool functions (will be wrapped with FunctionTool)
def send_task_to_agent(
    agent_name: str,
    message: str,
    context: Optional[Dict[str, Any]] = None,
    session_id: Optional[str] = None,
    timeout: int = 30
) -> Dict[str, Any]:
    """
    Send a task to a sub-agent using A2A protocol.

    Args:
        agent_name: Name of the target agent (e.g., 'validation', 'user-creation')
        message: Natural language instruction for the agent
        context: Additional context data (user data, intent, etc.)
        session_id: Session ID for Memory Bank persistence
        timeout: Request timeout in seconds

    Returns:
        Dict with status, agent name, data/error, duration_ms, session_id
    """
    start_time = time.time()

    try:
        # Initialize A2A client
        a2a_client = A2AClient(
            project_id="hustleapp-production",
            region="us-central1"
        )

        # Use or create session ID
        if session_id is None:
            session_id = str(uuid.uuid4())

        logger.info(
            f"A2A Tool: Sending task to {agent_name}",
            extra={
                "agent": agent_name,
                "session_id": session_id,
                "message": message
            }
        )

        # Send task via A2A SDK
        response = a2a_client.send_task(
            agent_name=f"hustle-{agent_name}-agent",
            message=message,
            context=context or {},
            session_id=session_id,
            timeout=timeout
        )

        duration_ms = int((time.time() - start_time) * 1000)

        logger.info(
            f"A2A Tool: Received response from {agent_name}",
            extra={
                "agent": agent_name,
                "duration_ms": duration_ms,
                "status": "success"
            }
        )

        return {
            "status": "success",
            "agent": agent_name,
            "data": response,
            "duration_ms": duration_ms,
            "session_id": session_id
        }

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)

        logger.error(
            f"A2A Tool: Error calling {agent_name}",
            extra={
                "agent": agent_name,
                "error": str(e),
                "duration_ms": duration_ms
            }
        )

        return {
            "status": "failed",
            "agent": agent_name,
            "error": str(e),
            "duration_ms": duration_ms
        }


def validate_user_registration(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    agreed_to_terms: bool,
    is_parent_guardian: bool,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate user registration data.

    Args:
        email: User email address
        password: User password
        first_name: User first name
        last_name: User last name
        agreed_to_terms: Whether user agreed to terms
        is_parent_guardian: Whether user is a parent/guardian
        session_id: Session ID for persistence

    Returns:
        Validation result with valid flag and any errors
    """
    return send_task_to_agent(
        agent_name="validation",
        message="Validate user registration data",
        context={
            "intent": "user_registration",
            "data": {
                "email": email,
                "password": password,
                "firstName": first_name,
                "lastName": last_name,
                "agreedToTerms": agreed_to_terms,
                "isParentGuardian": is_parent_guardian
            }
        },
        session_id=session_id,
        timeout=10
    )


def create_user_account(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    agreed_to_terms: bool,
    is_parent_guardian: bool,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a new user account in Firebase Auth and Firestore.

    Args:
        email: User email address
        password: User password
        first_name: User first name
        last_name: User last name
        agreed_to_terms: Whether user agreed to terms
        is_parent_guardian: Whether user is a parent/guardian
        session_id: Session ID for persistence

    Returns:
        Creation result with userId and user data
    """
    return send_task_to_agent(
        agent_name="user-creation",
        message="Create new user account",
        context={
            "intent": "user_registration",
            "data": {
                "email": email,
                "password": password,
                "firstName": first_name,
                "lastName": last_name,
                "agreedToTerms": agreed_to_terms,
                "isParentGuardian": is_parent_guardian
            }
        },
        session_id=session_id,
        timeout=15
    )


def send_onboarding_email(
    user_id: str,
    email: str,
    first_name: str,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send onboarding email with verification token.

    Args:
        user_id: User ID from Firebase Auth
        email: User email address
        first_name: User first name for personalization
        session_id: Session ID for persistence

    Returns:
        Onboarding result with emailSent flag
    """
    return send_task_to_agent(
        agent_name="onboarding",
        message="Send welcome email and verification token",
        context={
            "userId": user_id,
            "email": email,
            "firstName": first_name
        },
        session_id=session_id,
        timeout=20
    )


def track_analytics_event(
    event_name: str,
    user_id: Optional[str] = None,
    player_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Track analytics event in BigQuery/Firestore.

    Args:
        event_name: Event name (e.g., 'user_registration', 'player_creation')
        user_id: Optional user ID
        player_id: Optional player ID
        metadata: Additional event metadata
        session_id: Session ID for persistence

    Returns:
        Analytics tracking result
    """
    return send_task_to_agent(
        agent_name="analytics",
        message=f"Track {event_name} event",
        context={
            "event": event_name,
            "userId": user_id,
            "playerId": player_id,
            "metadata": metadata or {}
        },
        session_id=session_id,
        timeout=10
    )


# Create ADK Agent with wrapped tools
hustle_orchestrator = Agent(
    name="hustle_operations_manager",
    description="""
    Hustle Operations Manager - Main Orchestrator

    Coordinates all Hustle operations by routing requests to appropriate
    sub-agents and aggregating their responses. Handles user registration,
    player creation, game logging, and other core operations.

    Uses Agent-to-Agent (A2A) protocol to communicate with sub-agents:
    - Validation Agent: Data validation
    - User Creation Agent: Account/player creation
    - Onboarding Agent: Welcome emails, verification
    - Analytics Agent: Event tracking
    """,
    tools=[
        FunctionTool(send_task_to_agent),
        FunctionTool(validate_user_registration),
        FunctionTool(create_user_account),
        FunctionTool(send_onboarding_email),
        FunctionTool(track_analytics_event)
    ],
    model="gemini-2.0-flash-exp"  # Specify Gemini 2.0 Flash for orchestration
)


# Main entry point for Cloud Functions / Cloud Run
def handle_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point for handling requests using ADK Runner.

    Called by Cloud Functions or Cloud Run.

    Args:
        request_data: Request payload with intent, data, auth

    Returns:
        Agent execution result
    """
    intent = request_data.get("intent")
    data = request_data.get("data")
    auth = request_data.get("auth")

    request_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())

    logger.info(
        f"ADK Orchestrator: Received intent {intent}",
        extra={
            "intent": intent,
            "request_id": request_id,
            "user_id": auth.get("uid") if auth else None
        }
    )

    # Construct natural language prompt for ADK agent
    if intent == "user_registration":
        prompt = f"""
        Process user registration for:
        - Email: {data['email']}
        - Name: {data['firstName']} {data['lastName']}

        Steps:
        1. Validate registration data
        2. Create user account if valid
        3. Send onboarding email
        4. Track analytics event

        Return success status and user ID.
        """
    elif intent == "player_creation":
        user_id = auth.get("uid")
        prompt = f"""
        Create player profile for user {user_id}:
        - Player name: {data['name']}
        - Position: {data.get('position', 'N/A')}

        Steps:
        1. Validate player data
        2. Create player profile
        3. Track analytics event

        Return success status and player ID.
        """
    elif intent == "game_logging":
        prompt = f"""
        Log game statistics:
        - Player ID: {data['playerId']}
        - Game data: {data}

        Steps:
        1. Validate game data
        2. Create game record
        3. Track analytics event

        Return success status and game ID.
        """
    else:
        return {
            "success": False,
            "errors": [{
                "agent": "orchestrator",
                "code": "UNKNOWN_INTENT",
                "message": f"Unknown intent: {intent}"
            }]
        }

    try:
        # Execute agent using ADK Runner with session service
        session_service = InMemorySessionService()
        runner = Runner(
            app_name="hustle_operations_manager",
            agent=hustle_orchestrator,
            session_service=session_service
        )

        # Create Content object from prompt
        user_message = Content(
            role="user",
            parts=[Part(text=prompt)]
        )

        # Run agent and collect events
        events = runner.run(
            user_id="system",  # System user for Cloud Functions
            session_id=session_id,
            new_message=user_message
        )

        # Collect response from events
        response_text = ""
        for event in events:
            # Extract response from events
            if hasattr(event, 'content') and event.content:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        response_text += part.text

        logger.info(
            f"ADK Orchestrator: Completed {intent}",
            extra={
                "intent": intent,
                "request_id": request_id,
                "session_id": session_id
            }
        )

        return {
            "success": True,
            "data": {"response": response_text},
            "session_id": session_id
        }

    except Exception as e:
        logger.error(
            f"ADK Orchestrator: Error processing {intent}",
            extra={
                "intent": intent,
                "request_id": request_id,
                "error": str(e)
            }
        )

        return {
            "success": False,
            "errors": [{
                "agent": "orchestrator",
                "code": "ORCHESTRATION_ERROR",
                "message": str(e)
            }]
        }


# Export for deployment
if __name__ == "__main__":
    # For local testing
    test_request = {
        "intent": "user_registration",
        "data": {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "firstName": "Test",
            "lastName": "User",
            "agreedToTerms": True,
            "isParentGuardian": True
        },
        "auth": None
    }

    result = handle_request(test_request)
    print(f"Test result: {result}")
