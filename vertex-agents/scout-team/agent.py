"""
Hustle Scout Team - Multi-Agent System
Built following Google ADK Agent Team tutorial from https://google.github.io/adk-docs/tutorials/agent-team/

Lead Scout Agent orchestrates specialized sub-agents:
- Stats Logger: Records game statistics
- Performance Analyst: Analyzes trends and insights
- Recruitment Advisor: College recruitment guidance
- Benchmark Specialist: Percentile comparisons
"""

from google.adk.agents import Agent
from google.adk.tools.tool_context import ToolContext
from typing import Optional


# ============================================================================
# TOOLS FOR STATS LOGGER AGENT
# ============================================================================

def log_game_stats(
    player_name: str,
    goals: int = 0,
    assists: int = 0,
    saves: int = 0,
    minutes_played: int = 0,
    opponent: str = "",
    game_type: str = "league",
    tool_context: Optional[ToolContext] = None,
) -> dict:
    """
    Log game statistics for a player to Firestore.

    This tool records a player's performance in a game including goals,
    assists, saves, and minutes played.

    Args:
        player_name (str): The player's full name.
        goals (int, optional): Number of goals scored. Defaults to 0.
        assists (int, optional): Number of assists. Defaults to 0.
        saves (int, optional): Number of saves (for goalkeepers). Defaults to 0.
        minutes_played (int, optional): Minutes played in the game. Defaults to 0.
        opponent (str, optional): Name of opposing team. Defaults to "".
        game_type (str, optional): Type of game - "league", "tournament", "showcase", or "scrimmage". Defaults to "league".
        tool_context (ToolContext, optional): Context with session state.

    Returns:
        dict: Status message and logged stats including:
            - status: "success" or "error"
            - message: Human-readable result
            - stats: The logged statistics
    """
    # TODO: Integrate with Firestore
    # Save to state for now
    if tool_context:
        tool_context.state[f"last_game_{player_name}"] = {
            "goals": goals,
            "assists": assists,
            "saves": saves,
            "minutes_played": minutes_played,
            "opponent": opponent,
            "game_type": game_type,
        }

    return {
        "status": "success",
        "message": f"✅ Logged stats for {player_name} vs {opponent} ({game_type})",
        "stats": {
            "player": player_name,
            "goals": goals,
            "assists": assists,
            "saves": saves,
            "minutes_played": minutes_played,
            "opponent": opponent,
            "game_type": game_type,
        },
    }


# ============================================================================
# TOOLS FOR PERFORMANCE ANALYST AGENT
# ============================================================================

def get_player_stats(
    player_name: str,
    timeframe: str = "season",
    tool_context: Optional[ToolContext] = None,
) -> dict:
    """
    Retrieve player statistics for analysis.

    Fetches historical performance data from Firestore for trend analysis.

    Args:
        player_name (str): The player's full name.
        timeframe (str, optional): Time period - "season", "career", "month", or "last_5_games". Defaults to "season".
        tool_context (ToolContext, optional): Context with session state.

    Returns:
        dict: Player statistics including:
            - status: "success" or "error"
            - player: Player name
            - timeframe: Requested timeframe
            - stats: Dictionary with averages and totals
    """
    # TODO: Query Firestore for real stats
    # Mock data for now
    stats = {
        "games_played": 10,
        "goals": 18,
        "assists": 8,
        "goals_per_game": 1.8,
        "assists_per_game": 0.8,
        "minutes_per_game": 65,
    }

    # Save to state
    if tool_context:
        tool_context.state[f"stats_{player_name}_{timeframe}"] = stats

    return {
        "status": "success",
        "player": player_name,
        "timeframe": timeframe,
        "stats": stats,
    }


def analyze_trends(
    player_name: str,
    stat_type: str = "goals",
    tool_context: Optional[ToolContext] = None,
) -> dict:
    """
    Analyze performance trends over time.

    Compares current performance to past periods to identify improvements
    or areas needing attention.

    Args:
        player_name (str): The player's full name.
        stat_type (str, optional): Stat to analyze - "goals", "assists", "saves", "minutes". Defaults to "goals".
        tool_context (ToolContext, optional): Context with session state.

    Returns:
        dict: Trend analysis including:
            - status: "success" or "error"
            - player: Player name
            - stat_type: Analyzed statistic
            - trend: "improving", "stable", or "declining"
            - comparison: Current vs previous period
    """
    # TODO: Calculate real trends from Firestore data
    return {
        "status": "success",
        "player": player_name,
        "stat_type": stat_type,
        "trend": "improving",
        "comparison": {
            "current_period": 1.8,
            "previous_period": 1.3,
            "change_percent": 40,
        },
    }


# ============================================================================
# TOOLS FOR RECRUITMENT ADVISOR AGENT
# ============================================================================

def get_recruitment_insights(
    player_name: str,
    target_division: str = "D1",
    tool_context: Optional[ToolContext] = None,
) -> dict:
    """
    Analyze college recruitment readiness.

    Compares player stats to college division benchmarks and provides
    actionable recommendations for recruitment preparation.

    Args:
        player_name (str): The player's full name.
        target_division (str, optional): Target NCAA division - "D1", "D2", "D3", or "NAIA". Defaults to "D1".
        tool_context (ToolContext, optional): Context with session state.

    Returns:
        dict: Recruitment analysis including:
            - status: "success" or "error"
            - player: Player name
            - division: Target division
            - readiness_score: 0-100 score
            - strengths: List of strong areas
            - areas_for_improvement: List of areas needing work
            - recommendations: Actionable next steps
    """
    # TODO: Calculate from real stats and benchmarks
    insights = {
        "status": "success",
        "player": player_name,
        "division": target_division,
        "readiness_score": 75,
        "strengths": [
            "Goals per game above D1 average (1.8 vs 1.5)",
            "Strong tournament performance",
        ],
        "areas_for_improvement": [
            "Need 2 more showcase events (has 1, needs 3)",
            "Minutes per game slightly below average",
        ],
        "recommendations": [
            "Register for 2 upcoming showcase tournaments",
            "Focus on conditioning to increase playing time",
            "Start creating highlight reel for recruiting video",
        ],
    }

    # Save to state
    if tool_context:
        tool_context.state[f"recruitment_{player_name}_{target_division}"] = insights

    return insights


# ============================================================================
# TOOLS FOR BENCHMARK SPECIALIST AGENT
# ============================================================================

def compare_to_benchmarks(
    player_name: str,
    position: str,
    tool_context: Optional[ToolContext] = None,
) -> dict:
    """
    Compare player to college recruitment benchmarks by position.

    Provides percentile rankings to understand where a player stands
    relative to college recruitment standards.

    Args:
        player_name (str): The player's full name.
        position (str): Player position - "forward", "midfielder", "defender", or "goalkeeper".
        tool_context (ToolContext, optional): Context with session state.

    Returns:
        dict: Benchmark comparison including:
            - status: "success" or "error"
            - player: Player name
            - position: Player position
            - percentiles: Dictionary of stat percentiles
            - division_fit: Best fit division based on stats
    """
    # TODO: Compare against real benchmark data
    return {
        "status": "success",
        "player": player_name,
        "position": position,
        "percentiles": {
            "goals_per_game": 85,  # 85th percentile
            "assists_per_game": 70,
            "minutes_played": 60,
        },
        "division_fit": "D1 - Strong candidate",
        "benchmarks": {
            "D1_avg_goals": 1.5,
            "player_goals": 1.8,
            "D1_avg_assists": 0.9,
            "player_assists": 0.8,
        },
    }


# ============================================================================
# SUB-AGENT DEFINITIONS (Following ADK Agent Team Pattern)
# ============================================================================

# Stats Logger Agent - Records game statistics
stats_logger_agent = Agent(
    name="stats_logger",
    model="gemini-2.0-flash-exp",
    description="Handles logging game statistics and player performance data using 'log_game_stats'.",
    instruction="""
Your ONLY task: Log game statistics when provided.

When you receive game data, use the log_game_stats tool to record it.
Always confirm what was logged and celebrate achievements!

Example:
User: "Emma scored 2 goals vs Riverside"
You: [Use log_game_stats tool]
You: "✅ Logged 2 goals for Emma vs Riverside! Great performance!"

DO NOT handle other types of requests. Stay focused on logging stats.
""",
    tools=[log_game_stats],
)

# Performance Analyst Agent - Analyzes trends and insights
performance_analyst_agent = Agent(
    name="performance_analyst",
    model="gemini-2.0-flash-exp",
    description="Analyzes player performance trends and statistics using 'get_player_stats' and 'analyze_trends'.",
    instruction="""
Your ONLY task: Analyze player performance and provide insights.

Use get_player_stats to fetch historical data.
Use analyze_trends to identify improvements or declines.
Always provide context and celebrate improvements!

Example:
User: "How is Emma doing this season?"
You: [Use get_player_stats]
You: [Use analyze_trends]
You: "Emma's having a great season! 18 goals in 10 games. Her goals per game
     is up 40% from last season (1.8 vs 1.3). She's really improving!"

DO NOT log stats or handle recruitment questions. Stay focused on analysis.
""",
    tools=[get_player_stats, analyze_trends],
)

# Recruitment Advisor Agent - College recruitment guidance
recruitment_advisor_agent = Agent(
    name="recruitment_advisor",
    model="gemini-2.0-flash-exp",
    description="Provides college recruitment insights and readiness analysis using 'get_recruitment_insights'.",
    instruction="""
Your ONLY task: Provide college recruitment guidance.

Use get_recruitment_insights to analyze readiness for college divisions.
Be encouraging but realistic. Provide specific, actionable recommendations.

Example:
User: "What does Emma need for D1 recruitment?"
You: [Use get_recruitment_insights]
You: "Based on Emma's stats, she's 75% ready for D1 recruitment!

✅ Strengths:
- Goals per game above D1 average
- Strong tournament performance

⚠️  Areas to work on:
- Needs 2 more showcase events

💡 Next steps:
1. Register for 2 showcases
2. Create highlight reel

She's on the right track!"

DO NOT log stats or analyze trends. Stay focused on recruitment.
""",
    tools=[get_recruitment_insights],
)

# Benchmark Specialist Agent - Percentile comparisons
benchmark_specialist_agent = Agent(
    name="benchmark_specialist",
    model="gemini-2.0-flash-exp",
    description="Compares player statistics to college benchmarks by position using 'compare_to_benchmarks'.",
    instruction="""
Your ONLY task: Compare players to college recruitment benchmarks.

Use compare_to_benchmarks to show percentile rankings and division fit.
Make the data easy to understand with clear explanations.

Example:
User: "How does Emma compare to other forwards?"
You: [Use compare_to_benchmarks]
You: "Emma's in the 85th percentile for goals per game among forwards!
     That means she's better than 85% of players at her position.

     She's tracking as a strong D1 candidate based on these stats."

DO NOT log stats, analyze trends, or provide recruitment advice. Stay focused on benchmarks.
""",
    tools=[compare_to_benchmarks],
)


# ============================================================================
# LEAD SCOUT AGENT (Root Orchestrator)
# ============================================================================

lead_scout_agent = Agent(
    name="lead_scout",
    model="gemini-2.0-flash-exp",
    description="Lead coordinator for Hustle Scout team. Routes requests to specialized sub-agents and provides friendly conversation.",
    instruction="""
You are Scout, the lead coordinator for a team of youth sports specialists.

## Your Role

You coordinate a team of specialists:
- **Stats Logger**: Logs game statistics (delegate with "stats_logger")
- **Performance Analyst**: Analyzes trends and insights (delegate with "performance_analyst")
- **Recruitment Advisor**: Provides college recruitment guidance (delegate with "recruitment_advisor")
- **Benchmark Specialist**: Compares to college benchmarks (delegate with "benchmark_specialist")

## Routing Guide

**When to delegate:**

1. Logging game stats → **stats_logger**
   - User mentions: "scored 2 goals", "logged stats", "game results"

2. Performance analysis → **performance_analyst**
   - User asks: "how is [player] doing?", "what are the stats?", "show me trends"

3. Recruitment questions → **recruitment_advisor**
   - User asks: "college recruitment", "D1 ready?", "what does [player] need?"

4. Benchmark comparisons → **benchmark_specialist**
   - User asks: "how does [player] compare?", "percentile", "division fit"

**When to respond yourself:**
- Greetings and casual conversation
- General questions about the app
- Clarifying questions before delegating

## Your Personality

- Encouraging and positive
- Conversational and friendly
- Knowledgeable coordinator
- Always celebrate achievements

## Example Interactions

User: "Hi Scout!"
You: "Hey there! I'm Scout, your personal sports stats coordinator. I work with
     a team of specialists to help track your player's journey. What can we help
     you with today?"

User: "Emma scored 2 goals today"
You: "That's awesome! Let me get our Stats Logger to record that."
[Delegate to stats_logger]
You: [After delegation] "Great job Emma! 2 goals is fantastic!"

User: "How is Emma doing this season?"
You: "Let me get our Performance Analyst to pull up Emma's stats and trends."
[Delegate to performance_analyst]
You: [After delegation] "She's really progressing well!"

User: "Is Emma ready for D1?"
You: "Let me check with our Recruitment Advisor for a detailed analysis."
[Delegate to recruitment_advisor]
You: [After delegation] "Keep up the great work!"

## Important

- Delegate to specialists for their expertise
- Add your own friendly commentary before/after
- Celebrate achievements and progress
- Be the friendly coordinator who ties everything together
""",
    tools=[],  # Lead Scout has no direct tools, only delegates
    sub_agents=[
        stats_logger_agent,
        performance_analyst_agent,
        recruitment_advisor_agent,
        benchmark_specialist_agent,
    ],
    output_key="last_scout_response",  # Auto-save response to state
)


# ============================================================================
# EXPORT FOR DEPLOYMENT
# ============================================================================

# Root agent for deployment
root_agent = lead_scout_agent
