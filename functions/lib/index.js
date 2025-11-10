"use strict";
/**
 * Hustle A2A Agent System - Cloud Functions
 *
 * This file contains the Cloud Functions that interface with Vertex AI agents.
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
exports.analyticsAgent = exports.onboardingAgent = exports.userCreationAgent = exports.validationAgent = exports.orchestrator = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
/**
 * Orchestrator Agent Entry Point
 *
 * Receives requests from the frontend and routes them to the appropriate
 * Vertex AI agent for processing.
 *
 * Example call:
 * ```typescript
 * const result = await functions.httpsCallable('orchestrator')({
 *   intent: 'user_registration',
 *   data: {
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     password: 'SecurePass123!'
 *   }
 * });
 * ```
 */
exports.orchestrator = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 30,
    memory: '512MB'
})
    .https.onCall(async (data, context) => {
    try {
        const { intent, data: requestData } = data;
        // Validate authentication for most intents
        if (intent !== 'user_registration' && !context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to perform this action');
        }
        // Log request
        console.log(`Orchestrator received intent: ${intent}`, {
            userId: context.auth?.uid,
            requestId: context.instanceIdToken
        });
        // TODO: Replace with actual Vertex AI agent call
        // For now, return a mock response
        const response = await processIntent(intent, requestData, context);
        return response;
    }
    catch (error) {
        console.error('Orchestrator error:', error);
        throw new functions.https.HttpsError('internal', 'An error occurred processing your request');
    }
});
/**
 * Process intent and route to appropriate handler
 *
 * This will be replaced with Vertex AI agent calls once agents are deployed
 */
async function processIntent(intent, data, context) {
    switch (intent) {
        case 'user_registration':
            return handleUserRegistration(data);
        case 'player_creation':
            return handlePlayerCreation(data, context.auth.uid);
        case 'game_logging':
            return handleGameLogging(data, context.auth.uid);
        default:
            throw new functions.https.HttpsError('invalid-argument', `Unknown intent: ${intent}`);
    }
}
/**
 * Handle user registration
 *
 * TODO: Replace with Vertex AI agent call
 */
async function handleUserRegistration(data) {
    console.log('Processing user registration (mock)');
    return {
        success: true,
        data: {
            userId: 'mock-user-id',
            emailVerificationSent: true
        },
        message: 'Account created successfully. Please check your email to verify your account.',
        agent_execution: {
            validation: {
                status: 'success',
                duration_ms: 150
            },
            creation: {
                status: 'success',
                userId: 'mock-user-id',
                duration_ms: 320
            },
            onboarding: {
                status: 'success',
                emailSent: true,
                duration_ms: 450
            },
            analytics: {
                status: 'success',
                duration_ms: 200
            }
        }
    };
}
/**
 * Handle player creation
 *
 * TODO: Replace with Vertex AI agent call
 */
async function handlePlayerCreation(data, userId) {
    console.log('Processing player creation (mock)');
    return {
        success: true,
        data: {
            playerId: 'mock-player-id',
            name: data.name
        },
        agent_execution: {
            validation: {
                status: 'success',
                duration_ms: 120
            },
            creation: {
                status: 'success',
                playerId: 'mock-player-id',
                duration_ms: 280
            },
            analytics: {
                status: 'success',
                duration_ms: 150
            }
        }
    };
}
/**
 * Handle game logging
 *
 * TODO: Replace with Vertex AI agent call
 */
async function handleGameLogging(data, userId) {
    console.log('Processing game logging (mock)');
    return {
        success: true,
        data: {
            gameId: 'mock-game-id',
            playerId: data.playerId
        },
        agent_execution: {
            validation: {
                status: 'success',
                duration_ms: 180
            },
            creation: {
                status: 'success',
                gameId: 'mock-game-id',
                duration_ms: 350
            },
            analytics: {
                status: 'success',
                duration_ms: 220
            }
        }
    };
}
/**
 * Validation Agent
 *
 * Handles input validation and security checks
 */
exports.validationAgent = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 10,
    memory: '256MB'
})
    .https.onCall(async (data, context) => {
    // TODO: Implement validation logic
    return { valid: true, errors: [] };
});
/**
 * User Creation Agent
 *
 * Handles user and player creation in Firestore
 */
exports.userCreationAgent = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 15,
    memory: '512MB'
})
    .https.onCall(async (data, context) => {
    // TODO: Implement user creation logic
    return { userId: 'created-id', created: true };
});
/**
 * Onboarding Agent
 *
 * Handles welcome emails and onboarding flow
 */
exports.onboardingAgent = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 20,
    memory: '256MB'
})
    .https.onCall(async (data, context) => {
    // TODO: Implement onboarding logic
    return { emailSent: true, tokenId: 'token-id' };
});
/**
 * Analytics Agent
 *
 * Handles metrics tracking and dashboard updates
 */
exports.analyticsAgent = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 10,
    memory: '256MB'
})
    .https.onCall(async (data, context) => {
    // TODO: Implement analytics logic
    return { tracked: true };
});
//# sourceMappingURL=index.js.map