/**
 * A2A Protocol Client for Cloud Functions
 *
 * Enables Cloud Functions to communicate with Vertex AI agents
 * using the Agent-to-Agent (A2A) protocol.
 */

import { v4 as uuidv4 } from 'uuid';
import * as logger from 'firebase-functions/logger';

interface A2ARequest {
  intent: string;
  data: any;
  auth?: {
    uid?: string;
    email?: string;
  };
  sessionId?: string;
}

interface A2AResponse {
  success: boolean;
  data?: any;
  errors?: Array<{
    agent: string;
    code: string;
    message: string;
  }>;
  message?: string;
  agent_execution?: {
    [key: string]: {
      status: string;
      duration_ms: number;
      [key: string]: any;
    };
  };
}

interface AgentEndpoint {
  name: string;
  url: string;
  timeout: number;
  retries: number;
}

/**
 * A2A Protocol Client
 *
 * Communicates with Vertex AI agents deployed on Agent Engine.
 */
export class A2AClient {
  // @ts-ignore - Reserved for future use
  private projectId: string;
  // @ts-ignore - Reserved for future use
  private region: string;
  private sessionId: string | null = null;

  // Agent endpoints
  private agents: Record<string, AgentEndpoint> = {
    orchestrator: {
      name: 'hustle-operations-manager',
      url: `https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/agents/hustle-operations-manager`,
      timeout: 30000,
      retries: 3,
    },
    validation: {
      name: 'hustle-validation-agent',
      url: `https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/agents/hustle-validation-agent`,
      timeout: 10000,
      retries: 3,
    },
    userCreation: {
      name: 'hustle-user-creation-agent',
      url: `https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/agents/hustle-user-creation-agent`,
      timeout: 15000,
      retries: 3,
    },
    onboarding: {
      name: 'hustle-onboarding-agent',
      url: `https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/agents/hustle-onboarding-agent`,
      timeout: 20000,
      retries: 2,
    },
    analytics: {
      name: 'hustle-analytics-agent',
      url: `https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/agents/hustle-analytics-agent`,
      timeout: 10000,
      retries: 2,
    },
  };

  constructor(projectId: string = 'hustleapp-production', region: string = 'us-central1') {
    this.projectId = projectId;
    this.region = region;
  }

  /**
   * Send task to orchestrator agent
   */
  async sendTask(request: A2ARequest): Promise<A2AResponse> {
    const startTime = Date.now();
    const sessionId = request.sessionId || uuidv4();
    this.sessionId = sessionId;

    const requestId = uuidv4();

    logger.info('A2A: Sending task to orchestrator', {
      intent: request.intent,
      requestId,
      sessionId,
      userId: request.auth?.uid,
    });

    try {
      // Prepare payload for Vertex AI agent
      const payload = {
        message: `Execute ${request.intent} intent`,
        session_id: sessionId,
        context: {
          intent: request.intent,
          data: request.data,
          auth: request.auth,
        },
        config: {
          enable_memory_bank: true,
        },
      };

      // Call orchestrator agent
      const response = await this.callAgent('orchestrator', payload);

      const duration = Date.now() - startTime;

      logger.info('A2A: Received response from orchestrator', {
        intent: request.intent,
        requestId,
        duration_ms: duration,
        success: response.success,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('A2A: Error calling orchestrator', {
        intent: request.intent,
        requestId,
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        errors: [
          {
            agent: 'orchestrator',
            code: 'A2A_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      };
    }
  }

  /**
   * Call a specific agent
   */
  private async callAgent(agentName: string, payload: any): Promise<A2AResponse> {
    const agent = this.agents[agentName];

    if (!agent) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    const startTime = Date.now();

    try {
      // Note: This is a placeholder for actual Vertex AI Agent API call
      // The actual implementation will use the Vertex AI Agent Builder API
      // via @google-cloud/aiplatform package

      // For now, return mock response
      logger.warn('A2A: Using mock response (agents not yet deployed)');

      return this.getMockResponse(payload.context.intent);
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('A2A: Agent call failed', {
        agent: agentName,
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Mock response for testing before agents are deployed
   */
  private getMockResponse(intent: string): A2AResponse {
    switch (intent) {
      case 'user_registration':
        return {
          success: true,
          data: {
            userId: `mock-user-${Date.now()}`,
            emailVerificationSent: true,
          },
          message: 'Account created successfully. Please check your email to verify your account.',
          agent_execution: {
            validation: {
              status: 'success',
              duration_ms: 150,
            },
            creation: {
              status: 'success',
              userId: `mock-user-${Date.now()}`,
              duration_ms: 320,
            },
            onboarding: {
              status: 'success',
              emailSent: true,
              duration_ms: 450,
            },
            analytics: {
              status: 'success',
              duration_ms: 200,
            },
          },
        };

      case 'player_creation':
        return {
          success: true,
          data: {
            playerId: `mock-player-${Date.now()}`,
            name: 'Test Player',
          },
          agent_execution: {
            validation: {
              status: 'success',
              duration_ms: 120,
            },
            creation: {
              status: 'success',
              playerId: `mock-player-${Date.now()}`,
              duration_ms: 280,
            },
            analytics: {
              status: 'success',
              duration_ms: 150,
            },
          },
        };

      case 'game_logging':
        return {
          success: true,
          data: {
            gameId: `mock-game-${Date.now()}`,
            playerId: 'mock-player-id',
          },
          agent_execution: {
            validation: {
              status: 'success',
              duration_ms: 180,
            },
            creation: {
              status: 'success',
              gameId: `mock-game-${Date.now()}`,
              duration_ms: 350,
            },
            analytics: {
              status: 'success',
              duration_ms: 220,
            },
          },
        };

      default:
        return {
          success: false,
          errors: [
            {
              agent: 'orchestrator',
              code: 'UNKNOWN_INTENT',
              message: `Unknown intent: ${intent}`,
            },
          ],
        };
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Create new session
   */
  createSession(): string {
    this.sessionId = uuidv4();
    return this.sessionId;
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.sessionId = null;
  }
}

/**
 * Singleton instance for reuse across function invocations
 */
let clientInstance: A2AClient | null = null;

/**
 * Get or create A2A client instance
 */
export function getA2AClient(): A2AClient {
  if (!clientInstance) {
    clientInstance = new A2AClient();
  }
  return clientInstance;
}
