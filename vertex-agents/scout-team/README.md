# Hustle Scout Team - Multi-Agent System

**Personal Sports Statistics Team for Youth Athletes**

Built following **Google ADK Agent Team tutorial** from https://google.github.io/adk-docs/tutorials/agent-team/

## Architecture

### Lead Scout (Root Agent)
**Role**: Orchestrator that delegates to specialized sub-agents

**Capabilities**:
- Analyzes user requests and routes to appropriate specialist
- Provides friendly conversation and context
- Coordinates team responses
- No direct tools - delegates all work

### Sub-Agents (Specialists)

#### 1. Stats Logger
**Role**: Records game statistics
**Tools**: `log_game_stats`
**Triggers**: "Emma scored 2 goals", "log stats", "game results"

#### 2. Performance Analyst
**Role**: Analyzes trends and insights
**Tools**: `get_player_stats`, `analyze_trends`
**Triggers**: "how is Emma doing?", "show trends", "performance"

#### 3. Recruitment Advisor
**Role**: College recruitment guidance
**Tools**: `get_recruitment_insights`
**Triggers**: "D1 ready?", "college recruitment", "what does Emma need?"

#### 4. Benchmark Specialist
**Role**: Percentile comparisons
**Tools**: `compare_to_benchmarks`
**Triggers**: "how does Emma compare?", "percentile", "division fit"

## Agent Team Pattern (ADK Standard)

```python
# Sub-agents with focused roles
stats_logger_agent = Agent(
    name="stats_logger",
    model="gemini-2.0-flash-exp",
    description="Handles logging game statistics...",  # Used for routing
    instruction="Your ONLY task: Log game statistics",  # Narrow focus
    tools=[log_game_stats],
)

# More sub-agents...

# Root agent orchestrates
lead_scout_agent = Agent(
    name="lead_scout",
    model="gemini-2.0-flash-exp",
    description="Lead coordinator...",
    instruction="Route requests to specialists...",  # Routing logic
    tools=[],  # No direct tools - delegates only
    sub_agents=[  # Key: sub_agents parameter
        stats_logger_agent,
        performance_analyst_agent,
        recruitment_advisor_agent,
        benchmark_specialist_agent,
    ],
)
```

## How Delegation Works

### Automatic Routing
Per ADK docs: "The root agent's LLM evaluates the message and considers each sub-agent's description."

**Example Flow**:
```
User: "Emma scored 2 goals today"
  ↓
Lead Scout: Analyzes request
  ↓ Sees keyword "scored"
  ↓ Matches stats_logger description
  ↓
Lead Scout: Delegates to stats_logger
  ↓
Stats Logger: Uses log_game_stats tool
  ↓
Stats Logger: Returns result
  ↓
Lead Scout: Adds friendly commentary
  ↓
Response: "✅ Logged 2 goals for Emma! Great performance!"
```

## State Management

Tools can access and persist state via `ToolContext`:

```python
def log_game_stats(
    player_name: str,
    goals: int = 0,
    tool_context: Optional[ToolContext] = None,
) -> dict:
    # Save to session state
    if tool_context:
        tool_context.state[f"last_game_{player_name}"] = {
            "goals": goals,
            # ...
        }

    return {"status": "success", ...}
```

Auto-save agent responses:
```python
lead_scout_agent = Agent(
    # ...
    output_key="last_scout_response",  # Auto-saves to state
)
```

## Example Conversations

### Stats Logging
```
User: "Emma scored 2 goals vs Riverside"
Lead Scout: "That's awesome! Let me get our Stats Logger to record that."
[Delegates to stats_logger]
Stats Logger: [Uses log_game_stats]
Stats Logger: "✅ Logged 2 goals for Emma vs Riverside! Great performance!"
Lead Scout: "Great job Emma! Keep it up!"
```

### Performance Analysis
```
User: "How is Emma doing this season?"
Lead Scout: "Let me get our Performance Analyst to pull up Emma's stats."
[Delegates to performance_analyst]
Performance Analyst: [Uses get_player_stats + analyze_trends]
Performance Analyst: "Emma's having a great season! 18 goals in 10 games.
                     Her goals per game is up 40% from last season!"
Lead Scout: "She's really progressing well!"
```

### Recruitment Guidance
```
User: "Is Emma ready for D1?"
Lead Scout: "Let me check with our Recruitment Advisor."
[Delegates to recruitment_advisor]
Recruitment Advisor: [Uses get_recruitment_insights]
Recruitment Advisor: "Emma's 75% ready for D1 recruitment!
                     ✅ Strengths: Goals per game above D1 average
                     ⚠️  Need: 2 more showcase events
                     💡 Next: Register for showcases"
Lead Scout: "Keep up the great work!"
```

### Benchmark Comparison
```
User: "How does Emma compare to other forwards?"
Lead Scout: "Let me get our Benchmark Specialist to run the analysis."
[Delegates to benchmark_specialist]
Benchmark Specialist: [Uses compare_to_benchmarks]
Benchmark Specialist: "Emma's in the 85th percentile for goals per game!
                      She's tracking as a strong D1 candidate."
Lead Scout: "That's outstanding!"
```

## Deployment

### Local Testing
```bash
cd /home/jeremy/000-projects/hustle/vertex-agents
source venv/bin/activate
cd scout-team

# Automated tests
python test_local.py

# Interactive mode (chat with team)
python test_local.py interactive
```

### Deploy to Agent Engine
```bash
# Authenticate
gcloud auth application-default login
gcloud config set project hustleapp-production

# Deploy
python deploy.py
```

## Integration with Next.js

Same as single agent - the API route doesn't change:

```typescript
// app/api/scout/chat/route.ts
export async function POST(req: NextRequest) {
  const { messages, userId, sessionId } = await req.json();

  // Call Lead Scout Agent
  const response = await fetch(
    `https://us-central1-aiplatform.googleapis.com/v1/projects/hustleapp-production/locations/us-central1/reasoningEngines/${SCOUT_TEAM_RESOURCE_ID}:query`,
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
          session_id: sessionId,
          message: lastMessage,
        },
      }),
    }
  );

  return NextResponse.json({ message: data.output });
}
```

The multi-agent orchestration happens transparently on Agent Engine!

## Advantages Over Single Agent

### Modularity
- Easy to add new specialists (just create agent + add to sub_agents)
- Easy to remove or modify specialists without touching others
- Each specialist has focused instruction prompt

### Scalability
- Different models per specialist (expensive GPT-4 for complex tasks, cheaper for simple)
- Parallel execution potential
- Easier to test individual specialists

### Maintainability
- Clear separation of concerns
- Each specialist has single responsibility
- Easier to debug (know which specialist handled request)

## ADK Standards Compliance

✅ **Agent Team Pattern** (per https://google.github.io/adk-docs/tutorials/agent-team/):
- Root agent with `sub_agents` parameter
- Specialist agents with focused descriptions
- Automatic delegation based on description matching
- State management via `ToolContext`
- `output_key` for auto-saving responses

✅ **API Reference** (per https://google.github.io/adk-docs/api-reference/python/):
- `BaseAgent` hierarchy: root → sub-agents
- `find_sub_agent()` / `find_agent()` available
- `InvocationContext` for runtime state
- `AgentTool` for transfers between agents

## Next Steps

1. **Deploy to Agent Engine**
   ```bash
   cd scout-team && python deploy.py
   ```

2. **Connect tools to Firestore**
   - Replace mock data with real queries
   - Integrate with existing `/api/players` and `/api/games`

3. **Add more specialists**
   - **Coach Contact Tracker**: Log college coach interactions
   - **Showcase Finder**: Search/register for tournaments
   - **Highlight Reel Generator**: Create recruiting video data

4. **Advanced features**
   - Voice input for field-side logging
   - Photo upload for game highlights
   - Multi-language support

## Resources

- **ADK Agent Team Tutorial**: https://google.github.io/adk-docs/tutorials/agent-team/
- **Python API Reference**: https://google.github.io/adk-docs/api-reference/python/
- **Agent Engine Deployment**: https://google.github.io/adk-docs/deploy/agent-engine/
- **Single Agent Version**: `/home/jeremy/000-projects/hustle/vertex-agents/scout/`

## License

Private - Intent Solutions IO
