"use strict";
/**
 * A2A Protocol Client for Cloud Functions
 *
 * Enables Cloud Functions to communicate with Vertex AI agents
 * using the Agent-to-Agent (A2A) protocol.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AClient = void 0;
exports.getA2AClient = getA2AClient;
const uuid_1 = require("uuid");
const logger = __importStar(require("firebase-functions/logger"));
/**
 * A2A Protocol Client
 *
 * Communicates with Vertex AI agents deployed on Agent Engine.
 */
class A2AClient {
    constructor(projectId = 'hustleapp-production', region = 'us-central1') {
        this.sessionId = null;
        // Agent endpoints
        this.agents = {
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
        this.projectId = projectId;
        this.region = region;
    }
    /**
     * Send task to orchestrator agent
     */
    async sendTask(request) {
        const startTime = Date.now();
        const sessionId = request.sessionId || (0, uuid_1.v4)();
        this.sessionId = sessionId;
        const requestId = (0, uuid_1.v4)();
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
        }
        catch (error) {
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
    async callAgent(agentName, payload) {
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
        }
        catch (error) {
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
    getMockResponse(intent) {
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
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Create new session
     */
    createSession() {
        this.sessionId = (0, uuid_1.v4)();
        return this.sessionId;
    }
    /**
     * Clear session
     */
    clearSession() {
        this.sessionId = null;
    }
}
exports.A2AClient = A2AClient;
/**
 * Singleton instance for reuse across function invocations
 */
let clientInstance = null;
/**
 * Get or create A2A client instance
 */
function getA2AClient() {
    if (!clientInstance) {
        clientInstance = new A2AClient();
    }
    return clientInstance;
}
//# sourceMappingURL=a2a-client.js.map