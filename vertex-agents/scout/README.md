# Hustle Scout Agent

**Personal Sports Statistician for Youth Athletes**

Built following **Google ADK standards** from https://google.github.io/adk-docs/

## Overview

Scout is a conversational AI agent that acts as a personal sports statistician and college recruitment advisor for youth soccer players. Instead of filling out forms, parents can have natural conversations with Scout to log game stats, track performance, and get recruitment insights.

## Architecture

**Agent Type**: LLM Agent (non-deterministic, conversational)
**Model**: Gemini 2.0 Flash Exp
**Framework**: Google Agent Development Kit (ADK) 1.18.0
**Deployment**: Vertex AI Agent Engine
**Protocol**: Agent-to-Agent (A2A) ready

## Features

### 1. Conversational Stat Logging
```
User: "Emma scored 2 goals today"
Scout: "That's awesome! Was this a league or tournament game?"
User: "League against Riverside High"
Scout: "✅ Logged 2 goals for Emma vs Riverside High!"
```

### 2. Performance Analytics
```
User: "How is Emma doing this season?"
Scout: "Emma's having a great season! 18 goals and 8 assists in 10 games.
        Her goals per game (1.8) is above the D1 average of 1.5!"
```

### 3. Recruitment Insights
```
User: "What does Emma need for D1 recruitment?"
Scout: "Based on Emma's stats, here's where she stands:
        ✅ Goals per game above D1 average
        ⚠️  Needs 2 more showcase events
        💡 Next: Register for showcases, create highlight reel"
```

### 4. Benchmark Comparisons
```
User: "How does Emma compare to other forwards?"
Scout: "Emma's in the 85th percentile for goals per game!
        She's tracking as a strong D1 candidate."
```

## Tools (ADK Function Tools)

Following ADK standard pattern - Python functions auto-wrapped as tools:

1. **log_game_stats** - Record player performance
   - Parameters: player_name, goals, assists, saves, minutes_played, opponent, game_type
   - Returns: Status and logged stats

2. **get_player_stats** - Retrieve historical performance
   - Parameters: player_name, timeframe (season/career/month)
   - Returns: Averages, totals, trends

3. **get_recruitment_insights** - College recruitment analysis
   - Parameters: player_name, target_division (D1/D2/D3/NAIA)
   - Returns: Readiness score, strengths, recommendations

4. **compare_to_benchmarks** - Percentile rankings
   - Parameters: player_name, position
   - Returns: Percentiles, division fit, benchmark comparisons

## Project Structure

```
scout/
├── agent.py           # Main agent definition (LlmAgent)
├── deploy.py          # Deployment script for Agent Engine
├── test_local.py      # Local testing utilities
├── requirements.txt   # Python dependencies
├── __init__.py        # Package init
└── README.md          # This file
```

## Development Workflow

### 1. Local Testing

```bash
# Activate virtual environment
cd /home/jeremy/000-projects/hustle/vertex-agents
source venv/bin/activate

# Navigate to Scout
cd scout

# Run automated tests
python test_local.py

# OR: Interactive mode (chat with Scout directly)
python test_local.py interactive
```

### 2. Deploy to Agent Engine

```bash
# Authenticate with GCP
gcloud auth application-default login
gcloud config set project hustleapp-production

# Ensure Vertex AI API is enabled
gcloud services enable aiplatform.googleapis.com

# Create staging bucket (if needed)
gsutil mb -p hustleapp-production -l us-central1 gs://hustleapp-production-agent-staging

# Deploy
python deploy.py
```

### 3. Test Deployed Agent

```bash
# Via REST API
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/reasoningEngines/RESOURCE_ID:query \
  -d '{"class_method": "query", "input": {"user_id": "test_user", "session_id": "test_session", "message": "Hello Scout!"}}'
```

## Integration with Next.js

### API Route (`app/api/scout/chat/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function POST(req: NextRequest) {
  const { messages, userId, sessionId } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // Authenticate
  const auth = new GoogleAuth();
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  // Call Scout Agent on Agent Engine
  const response = await fetch(
    `https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/reasoningEngines/${SCOUT_RESOURCE_ID}:query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        class_method: 'query',
        input: {
          user_id: userId,
          session_id: sessionId || `session_${Date.now()}`,
          message: lastMessage,
        },
      }),
    }
  );

  const data = await response.json();
  return NextResponse.json({ message: data.output });
}
```

### Chat UI Component

```typescript
'use client';

import { useChat } from '@ai-sdk/react';

export default function ScoutChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/scout/chat',
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Tell Scout about the game..."
          className="w-full p-3 border rounded-lg"
        />
      </form>
    </div>
  );
}
```

## ADK Standards Compliance

✅ **Agent Definition** (per https://google.github.io/adk-docs/agents/llm-agents/):
- Required: `name`, `model`
- Optional: `description`, `instruction`, `tools`

✅ **Tool Pattern** (per https://google.github.io/adk-docs/tools-custom/function-tools/):
- Python functions with type hints
- Comprehensive docstrings
- Return dictionaries with status
- Auto-wrapped as FunctionTool

✅ **Deployment** (per https://google.github.io/adk-docs/deploy/agent-engine/):
- Initialize Vertex AI
- Wrap in AdkApp with tracing
- Deploy via agent_engines.create()
- Test with sessions

## Observability

Scout includes built-in observability via ADK/Agent Engine:

- **OpenTelemetry Tracing**: Automatic distributed tracing
- **Cloud Logging**: Structured logs with 10-year retention
- **Cloud Monitoring**: Request counts, latency, errors
- **Cloud Trace**: Visualize request flows

View in Cloud Console:
- Logs: https://console.cloud.google.com/logs
- Traces: https://console.cloud.google.com/traces
- Metrics: https://console.cloud.google.com/monitoring

## Next Steps

1. **Connect to Firestore** - Replace mock data with real stats
2. **Add More Tools** - Coach contacts, showcase tracking, highlight reels
3. **Multi-Agent** - Add sub-agents for validation, analytics
4. **Voice Input** - Speech-to-text for field-side logging
5. **Mobile App** - React Native wrapper for iOS/Android

## Resources

- **ADK Documentation**: https://google.github.io/adk-docs/
- **Agent Starter Pack**: https://github.com/GoogleCloudPlatform/agent-starter-pack
- **Vertex AI Agent Engine**: https://cloud.google.com/vertex-ai/docs/agent-builder
- **Project Documentation**: `/home/jeremy/000-projects/hustle/vertex-agents/CONVERSATIONAL_AGENT_DESIGN.md`

## License

Private - Intent Solutions IO
