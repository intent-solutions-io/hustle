"""
Hustle Operations Manager - Orchestrator Agent
Vertex AI ADK Agent with A2A Protocol Support

This agent orchestrates all Hustle operations by coordinating sub-agents
via the Agent-to-Agent (A2A) protocol.
"""

import uuid
import time
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed

from google.cloud import aiplatform
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


class A2AClient:
    """
    Agent-to-Agent Protocol Client

    Handles communication between Vertex AI agents using the A2A protocol.
    Implements session management, retry logic, and error handling.
    """

    def __init__(self, project_id: str, region: str = "us-central1"):
        self.project_id = project_id
        self.region = region
        self.session_id = None
        self.db = firestore.Client()

        # Initialize Vertex AI
        aiplatform.init(project=project_id, location=region)

    def send_task(
        self,
        agent_name: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Send a task to a sub-agent via A2A protocol.

        Args:
            agent_name: Name of the target agent
            message: Natural language instruction
            context: Additional context (user data, etc.)
            session_id: Session ID for Memory Bank persistence
            timeout: Request timeout in seconds

        Returns:
            Agent response with status and data
        """
        # Create or reuse session ID
        if session_id is None:
            self.session_id = self.session_id or str(uuid.uuid4())
        else:
            self.session_id = session_id

        start_time = time.time()

        try:
            # Construct agent endpoint
            agent_endpoint = (
                f"projects/{self.project_id}/"
                f"locations/{self.region}/"
                f"agents/hustle-{agent_name}-agent"
            )

            # Prepare payload
            payload = {
                "message": message,
                "session_id": self.session_id,
                "context": context or {},
                "config": {
                    "enable_memory_bank": True,
                }
            }

            logger.info(
                f"A2A: Sending task to {agent_name}",
                extra={
                    "agent": agent_name,
                    "session_id": self.session_id,
                    "payload": payload
                }
            )

            # Call agent via Vertex AI API
            # Note: Using Agent Builder API
            from google.cloud.aiplatform_v1 import AgentBuilderClient

            client = AgentBuilderClient()

            # Send task
            response = client.execute_agent(
                name=agent_endpoint,
                input_text=message,
                session_id=self.session_id,
                parameters=context or {},
                timeout=timeout
            )

            duration_ms = int((time.time() - start_time) * 1000)

            logger.info(
                f"A2A: Received response from {agent_name}",
                extra={
                    "agent": agent_name,
                    "duration_ms": duration_ms,
                    "status": "success"
                }
            )

            return {
                "status": "success",
                "agent": agent_name,
                "data": response.output,
                "duration_ms": duration_ms,
                "session_id": self.session_id
            }

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)

            logger.error(
                f"A2A: Error calling {agent_name}",
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


class HustleOrchestrator:
    """
    Hustle Operations Manager - Main Orchestrator

    Coordinates all Hustle operations by routing requests to appropriate
    sub-agents and aggregating their responses.
    """

    def __init__(self, project_id: str = "hustleapp-production"):
        self.project_id = project_id
        self.a2a_client = A2AClient(project_id)
        self.db = firestore.Client()

        # Performance tracking
        self.metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_execution_time": 0
        }

    def execute(
        self,
        intent: str,
        data: Dict[str, Any],
        auth: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main execution entry point.

        Args:
            intent: Intent name (user_registration, player_creation, etc.)
            data: Request data
            auth: Authentication context (userId, etc.)

        Returns:
            Standardized response with agent execution details
        """
        request_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        start_time = time.time()

        logger.info(
            f"Orchestrator: Received intent {intent}",
            extra={
                "intent": intent,
                "request_id": request_id,
                "user_id": auth.get("uid") if auth else None
            }
        )

        try:
            # Route to appropriate handler
            if intent == "user_registration":
                result = self._handle_user_registration(data, session_id)
            elif intent == "player_creation":
                result = self._handle_player_creation(data, auth, session_id)
            elif intent == "game_logging":
                result = self._handle_game_logging(data, auth, session_id)
            else:
                raise ValueError(f"Unknown intent: {intent}")

            # Track metrics
            duration_ms = int((time.time() - start_time) * 1000)
            self.metrics["total_requests"] += 1
            self.metrics["successful_requests"] += 1

            logger.info(
                f"Orchestrator: Completed {intent}",
                extra={
                    "intent": intent,
                    "request_id": request_id,
                    "duration_ms": duration_ms,
                    "success": result.get("success")
                }
            )

            return result

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self.metrics["total_requests"] += 1
            self.metrics["failed_requests"] += 1

            logger.error(
                f"Orchestrator: Error processing {intent}",
                extra={
                    "intent": intent,
                    "request_id": request_id,
                    "error": str(e),
                    "duration_ms": duration_ms
                }
            )

            return {
                "success": False,
                "errors": [{
                    "agent": "orchestrator",
                    "code": "ORCHESTRATION_ERROR",
                    "message": str(e)
                }],
                "agent_execution": {}
            }

    def _handle_user_registration(
        self,
        data: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        Handle user registration flow.

        Workflow:
        1. Validation Agent (sequential)
        2. User Creation Agent (sequential)
        3. Onboarding + Analytics Agents (parallel)
        """
        agent_results = {}

        # Step 1: Validation (sequential)
        validation_result = self.a2a_client.send_task(
            agent_name="validation",
            message="Validate user registration data",
            context={
                "intent": "user_registration",
                "data": data
            },
            session_id=session_id,
            timeout=10
        )

        agent_results["validation"] = validation_result

        if validation_result["status"] != "success":
            return {
                "success": False,
                "errors": [{
                    "agent": "validation",
                    "code": "VALIDATION_FAILED",
                    "message": validation_result.get("error", "Validation failed")
                }],
                "agent_execution": agent_results
            }

        # Check if validation actually passed
        if not validation_result.get("data", {}).get("valid", False):
            return {
                "success": False,
                "errors": validation_result.get("data", {}).get("errors", []),
                "agent_execution": agent_results
            }

        # Step 2: User Creation (sequential)
        creation_result = self.a2a_client.send_task(
            agent_name="user-creation",
            message="Create new user account",
            context={
                "intent": "user_registration",
                "data": data
            },
            session_id=session_id,
            timeout=15
        )

        agent_results["creation"] = creation_result

        if creation_result["status"] != "success":
            return {
                "success": False,
                "errors": [{
                    "agent": "creation",
                    "code": "CREATION_FAILED",
                    "message": creation_result.get("error", "User creation failed")
                }],
                "agent_execution": agent_results
            }

        user_id = creation_result.get("data", {}).get("userId")

        # Step 3: Onboarding + Analytics (parallel)
        with ThreadPoolExecutor(max_workers=2) as executor:
            # Submit onboarding task
            onboarding_future = executor.submit(
                self.a2a_client.send_task,
                agent_name="onboarding",
                message="Send welcome email and verification token",
                context={
                    "userId": user_id,
                    "email": data["email"],
                    "firstName": data["firstName"]
                },
                session_id=session_id,
                timeout=20
            )

            # Submit analytics task
            analytics_future = executor.submit(
                self.a2a_client.send_task,
                agent_name="analytics",
                message="Track user registration event",
                context={
                    "event": "user_registration",
                    "userId": user_id,
                    "metadata": {"email": data["email"]}
                },
                session_id=session_id,
                timeout=10
            )

            # Wait for completion
            agent_results["onboarding"] = onboarding_future.result()
            agent_results["analytics"] = analytics_future.result()

        # Aggregate results
        return {
            "success": True,
            "data": {
                "userId": user_id,
                "email": data["email"],
                "emailVerificationSent": agent_results["onboarding"].get("data", {}).get("emailSent", False)
            },
            "message": "Account created successfully. Please check your email to verify your account.",
            "agent_execution": agent_results
        }

    def _handle_player_creation(
        self,
        data: Dict[str, Any],
        auth: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """Handle player creation flow."""
        agent_results = {}
        user_id = auth.get("uid")

        # Step 1: Validation
        validation_result = self.a2a_client.send_task(
            agent_name="validation",
            message="Validate player creation data",
            context={
                "intent": "player_creation",
                "data": data,
                "userId": user_id
            },
            session_id=session_id,
            timeout=10
        )

        agent_results["validation"] = validation_result

        if not validation_result.get("data", {}).get("valid", False):
            return {
                "success": False,
                "errors": validation_result.get("data", {}).get("errors", []),
                "agent_execution": agent_results
            }

        # Step 2: Player Creation
        creation_result = self.a2a_client.send_task(
            agent_name="user-creation",
            message="Create new player profile",
            context={
                "intent": "player_creation",
                "data": data,
                "userId": user_id
            },
            session_id=session_id,
            timeout=15
        )

        agent_results["creation"] = creation_result

        player_id = creation_result.get("data", {}).get("playerId")

        # Step 3: Analytics (async)
        analytics_result = self.a2a_client.send_task(
            agent_name="analytics",
            message="Track player creation event",
            context={
                "event": "player_creation",
                "userId": user_id,
                "playerId": player_id,
                "metadata": {"position": data.get("position")}
            },
            session_id=session_id,
            timeout=10
        )

        agent_results["analytics"] = analytics_result

        return {
            "success": True,
            "data": {
                "playerId": player_id,
                "name": data["name"]
            },
            "agent_execution": agent_results
        }

    def _handle_game_logging(
        self,
        data: Dict[str, Any],
        auth: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """Handle game logging flow."""
        # Similar structure to player_creation
        # Implementation follows same pattern
        pass


# Main entry point for Cloud Functions / Cloud Run
def handle_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point for handling requests.

    Called by Cloud Functions or Cloud Run.
    """
    orchestrator = HustleOrchestrator(project_id="hustleapp-production")

    intent = request_data.get("intent")
    data = request_data.get("data")
    auth = request_data.get("auth")

    return orchestrator.execute(intent=intent, data=data, auth=auth)
