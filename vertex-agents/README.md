# Hustle A2A Agent System

Multi-agent system for the Hustle youth sports platform using Vertex AI Agent Engine and the Agent-to-Agent (A2A) protocol.

## Architecture

```
Frontend → Cloud Functions → Orchestrator Agent → Sub-Agents → Firestore
                                    ↓
                            Memory Bank (Sessions)
```

## Agents

### Orchestrator (hustle-operations-manager)
- Main coordinator
- Receives requests from Cloud Functions
- Routes to sub-agents
- Aggregates responses
- Manages sessions

### Sub-Agents

1. **Validation Agent** - Input validation, duplicate checking
2. **User Creation Agent** - Creates users/players/games in Firestore
3. **Onboarding Agent** - Sends emails, generates tokens
4. **Analytics Agent** - Tracks metrics, logs events

## Quick Start

### Prerequisites

```bash
# Authenticate
gcloud auth login
gcloud config set project hustleapp-production

# Install dependencies (Cloud Functions)
cd functions && npm install
```

### Deploy Agents

```bash
# Option 1: Manual (RECOMMENDED)
# Go to Vertex AI Console and create agents manually
# See: 000-docs/173-OD-DEPL-vertex-ai-a2a-deployment-guide.md

# Option 2: Script (checks prerequisites)
./deploy_agent.sh all
```

### Deploy Cloud Functions

```bash
# Build and deploy
cd functions
npm run build
cd ..
firebase deploy --only functions:orchestrator
```

### Test System

```bash
# Test registration flow
./test_a2a.sh registration

# Test all endpoints
./test_a2a.sh all
```

## Project Structure

```
vertex-agents/
├── orchestrator/
│   ├── config/
│   │   ├── agent.yaml          # Agent configuration
│   │   └── agent-card.json     # A2A AgentCard
│   └── src/
│       └── orchestrator_agent.py  # Python implementation
├── validation/
├── user-creation/
├── onboarding/
├── analytics/
├── deploy_agent.sh             # Deployment script
├── test_a2a.sh                 # Test script
└── README.md                   # This file
```

## Configuration Files

### agent.yaml

Main configuration for each agent:
- Model settings (Gemini 2.0 Flash)
- Tools configuration
- Intent definitions
- Performance settings
- A2A sub-agent endpoints

### agent-card.json

AgentCard for A2A discovery:
- Capabilities (memory_bank, async_tasks)
- Tool schemas (input/output)
- Intent definitions
- Deployment info

## A2A Protocol

### Session Management

```typescript
// Create session
const sessionId = uuidv4();

// Send task with session
const response = await a2aClient.sendTask({
  intent: 'user_registration',
  data: userData,
  sessionId: sessionId,
});

// Reuse session for subsequent calls
const response2 = await a2aClient.sendTask({
  intent: 'player_creation',
  data: playerData,
  sessionId: sessionId, // Same session
});
```

### Error Handling

```typescript
// Automatic retry for transient errors
// - Network timeouts
// - 429 Too Many Requests
// - 503 Service Unavailable

// Fail immediately for permanent errors
// - 400 Bad Request
// - 401 Unauthorized
// - 404 Not Found
```

## Deployment Steps

### 1. Deploy Orchestrator Agent

1. Open Vertex AI Console
2. Create agent "hustle-operations-manager"
3. Set model: Gemini 2.0 Flash
4. Copy prompt from `orchestrator/config/agent.yaml`
5. Add tools and intents
6. Deploy

### 2. Deploy Sub-Agents

Repeat for each sub-agent:
- hustle-validation-agent
- hustle-user-creation-agent
- hustle-onboarding-agent
- hustle-analytics-agent

### 3. Update Cloud Functions

```bash
cd functions
npm install uuid @types/uuid
npm run build
cd ..
firebase deploy --only functions:orchestrator
```

### 4. Test System

```bash
./test_a2a.sh all
```

## Monitoring

### Cloud Logging

```bash
# View orchestrator logs
gcloud logging read "resource.type=cloud_function
  AND resource.labels.function_name=orchestrator" \
  --limit=50 \
  --format=json

# View agent logs
gcloud logging read "resource.type=vertex_agent
  AND resource.labels.agent_name=hustle-operations-manager" \
  --limit=50
```

### Metrics

Key metrics to monitor:
- Execution time (p50, p95, p99)
- Success rate (target: > 99%)
- Error rate (target: < 1%)
- Cost per request (target: < $0.02)

## Troubleshooting

### Agent Not Found

```bash
# List all agents
gcloud ai agents list --region=us-central1

# Check specific agent
gcloud ai agents describe hustle-operations-manager --region=us-central1
```

### Authentication Errors

```bash
# Check service account
gcloud iam service-accounts describe hustle-agent-sa@hustleapp-production.iam.gserviceaccount.com

# Grant permissions
gcloud projects add-iam-policy-binding hustleapp-production \
  --member="serviceAccount:hustle-agent-sa@hustleapp-production.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Cloud Function Errors

```bash
# View function logs
firebase functions:log orchestrator --limit=50

# Check function status
gcloud functions describe orchestrator --region=us-central1
```

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Execution time (p95) | < 2s | > 5s |
| Success rate | > 99% | < 95% |
| Error rate | < 1% | > 5% |
| Cost per request | < $0.02 | > $0.05 |

## Cost Estimation

**Per 1,000 registrations:**
- Vertex AI: $14
- Firestore: $2
- Cloud Functions: $3
- **Total: $19**

**Per request:**
- Average: $0.019
- Target: < $0.02

## Documentation

- **Orchestrator Prompt**: `000-docs/171-AT-DSGN-orchestrator-agent-prompt.md`
- **Firebase Setup**: `000-docs/172-OD-DEPL-firebase-a2a-setup-complete.md`
- **Deployment Guide**: `000-docs/173-OD-DEPL-vertex-ai-a2a-deployment-guide.md`

## Support

For issues or questions:
1. Check deployment guide: `000-docs/173-OD-DEPL-vertex-ai-a2a-deployment-guide.md`
2. Review agent prompt: `000-docs/171-AT-DSGN-orchestrator-agent-prompt.md`
3. Check Cloud Logging for errors
4. Run test script: `./test_a2a.sh all`

## License

Proprietary - Hustle Development Team
