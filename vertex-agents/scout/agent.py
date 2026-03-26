"""
Hustle Scout Agent - Personal Sports Statistician
Built following Google ADK standards from https://google.github.io/adk-docs/

This agent acts as a conversational personal statistician for youth athletes
tracking their journey from youth soccer to college athletics.
"""

from google.adk.agents import Agent
from typing import Optional


# ============================================================================
# TOOL DEFINITIONS (Following ADK Function Tools Pattern)
# ============================================================================

def log_game_stats(
    player_name: str,
    goals: int = 0,
    assists: int = 0,
    saves: int = 0,
    minutes_played: int = 0,
    opponent: str = "",
    game_type: str = "league",
) -> dict:
    """
    Log game statistics for a player.

    This tool records a player's performance in a game including goals,
    assists, saves, and minutes played. Use this when the user mentions
    game results or player performance.

    Args:
        player_name (str): The player's full name.
        goals (int, optional): Number of goals scored. Defaults to 0.
        assists (int, optional): Number of assists. Defaults to 0.
        saves (int, optional): Number of saves (for goalkeepers). Defaults to 0.
        minutes_played (int, optional): Minutes played in the game. Defaults to 0.
        opponent (str, optional): Name of opposing team. Defaults to "".
        game_type (str, optional): Type of game - "league", "tournament", "showcase", or "scrimmage". Defaults to "league".

    Returns:
        dict: Status message and logged stats including:
            - status: "success" or "error"
            - message: Human-readable result
            - stats: The logged statistics
    """
    # TODO: Integrate with Firestore to actually save stats
    # For now, return success with the stats
    return {
        "status": "success",
        "message": f"Logged stats for {player_name} vs {opponent} ({game_type})",
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


def get_player_stats(
    player_name: str,
    timeframe: str = "season",
) -> dict:
    """
    Retrieve player statistics for a given timeframe.

    Use this tool to fetch historical performance data for a player.
    Useful when the user asks about a player's performance, averages,
    or season progress.

    Args:
        player_name (str): The player's full name.
        timeframe (str, optional): Time period for stats - "season", "career", "month", or "last_5_games". Defaults to "season".

    Returns:
        dict: Player statistics including:
            - status: "success" or "error"
            - player: Player name
            - timeframe: Requested timeframe
            - stats: Dictionary with averages and totals
    """
    # TODO: Query Firestore for actual stats
    # For now, return mock data
    return {
        "status": "success",
        "player": player_name,
        "timeframe": timeframe,
        "stats": {
            "games_played": 10,
            "goals": 18,
            "assists": 8,
            "goals_per_game": 1.8,
            "assists_per_game": 0.8,
            "minutes_per_game": 65,
        },
    }


def get_recruitment_insights(
    player_name: str,
    target_division: str = "D1",
) -> dict:
    """
    Get college recruitment insights and recommendations for a player.

    Analyzes player stats against college recruitment benchmarks and provides
    actionable recommendations. Use this when users ask about college prospects,
    recruitment readiness, or what their player needs for college athletics.

    Args:
        player_name (str): The player's full name.
        target_division (str, optional): Target NCAA division - "D1", "D2", "D3", or "NAIA". Defaults to "D1".

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
    # TODO: Calculate real recruitment readiness from actual stats
    return {
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


def compare_to_benchmarks(
    player_name: str,
    position: str,
) -> dict:
    """
    Compare player stats to college recruitment benchmarks by position.

    Provides percentile rankings and comparisons to help understand where
    a player stands relative to college recruitment standards.

    Args:
        player_name (str): The player's full name.
        position (str): Player position - "forward", "midfielder", "defender", or "goalkeeper".

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
# SCOUT AGENT DEFINITION (Following ADK LlmAgent Pattern)
# ============================================================================

scout_agent = Agent(
    # Required: Unique identifier (valid Python identifier, no hyphens)
    name="hustle_scout",

    # Required: Model specification
    model="gemini-2.0-flash-exp",

    # Optional: Description for multi-agent routing
    description="Personal sports statistician and recruitment advisor for youth athletes tracking their journey to college athletics",

    # Agent instructions (natural language prompt)
    instruction="""
You are Scout, a personal sports statistician and college recruitment advisor for youth soccer players.

## Your Role

You help parents and players track their sports journey from youth leagues to college athletics.
You remember every game, every stat, and provide insights on recruitment readiness.

## Your Personality

- Encouraging and positive - Celebrate achievements!
- Knowledgeable about college recruitment standards
- Data-driven but conversational and friendly
- Protective of youth athletes (COPPA compliant)
- Patient and helpful with parents learning the process

## What You Do

1. **Log Game Statistics Conversationally**
   - When users mention game results, ask clarifying questions
   - Example: "Emma scored 2 goals" → Ask about opponent, game type, playing time
   - Always confirm player name before logging

2. **Provide Performance Insights**
   - Compare current stats to past performance
   - Show trends ("Goals per game up 40% from last season!")
   - Celebrate milestones and improvements

3. **Guide College Recruitment Process**
   - Explain what different divisions look for
   - Suggest specific next steps (showcases, highlight reels)
   - Be realistic but encouraging about prospects

4. **Answer Questions About Stats**
   - Pull historical data when asked
   - Provide context ("That's top 15% for her position!")
   - Make data easy to understand

## Conversation Guidelines

✅ DO:
- Ask clarifying questions when info is missing
- Celebrate achievements ("That's amazing! 2 goals is huge!")
- Provide specific recruitment context when relevant
- Use simple, conversational language
- Remember player names and history from the conversation

❌ DON'T:
- Ask for personal info beyond sports stats (COPPA compliance)
- Make unrealistic promises about college recruitment
- Use technical jargon without explanation
- Provide generic advice - always be specific to the player

## Tool Usage

You have access to these tools:

1. `log_game_stats` - Use when user mentions game results
2. `get_player_stats` - Use to fetch historical performance
3. `get_recruitment_insights` - Use for college recruitment questions
4. `compare_to_benchmarks` - Use to show percentile rankings

Always use tools to access real data. Never make up statistics.

## Example Interactions

User: "Emma scored 2 goals today"
You: "That's awesome! 🎉 Was this a league or tournament game? And who was the opponent?"

User: "League game against Riverside High"
You: "Perfect! Let me log that for Emma."
[Call log_game_stats]
You: "✅ Logged 2 goals for Emma vs Riverside High! She's averaging 1.8 goals per game this season - that's D1 level! 🌟"

User: "How is Emma doing this season?"
[Call get_player_stats]
You: "Emma's having a great season! 18 goals and 8 assists in 10 games. Her goals per game (1.8) is above the D1 average of 1.5. She's on track for strong recruitment interest!"

User: "What does Emma need for college recruitment?"
[Call get_recruitment_insights]
You: "Based on Emma's stats, here's where she stands for D1 recruitment:

✅ Strengths:
- Goals per game above D1 average
- Strong tournament performance

⚠️  Areas to work on:
- Needs 2 more showcase events (has 1, needs 3)
- Minutes per game slightly below average

💡 Next steps:
1. Register for 2 upcoming showcase tournaments
2. Focus on conditioning to increase playing time
3. Start creating highlight reel for recruiting video

She's 75% ready - on the right track!"
""",

    # Tools available to the agent (Python functions automatically wrapped)
    tools=[
        log_game_stats,
        get_player_stats,
        get_recruitment_insights,
        compare_to_benchmarks,
    ],
)


# ============================================================================
# EXPORT FOR DEPLOYMENT
# ============================================================================

# This is what gets deployed to Agent Engine
root_agent = scout_agent
