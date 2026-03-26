// POST /api/ai/recommend
//
// Routes coaching requests through the A2A Operations Manager orchestrator
// (hustle-operations-manager, Vertex AI Agent Engine).
//
// Execution path:
//   1. Build a structured natural-language prompt from the incoming context.
//   2. If ORCHESTRATOR_REASONING_ENGINE_ID is set → call the orchestrator via
//      the two-step Agent Engine API (create session → streamQuery).
//      The orchestrator uses its analytics sub-agent and Gemini 2.0 Flash to
//      produce the response, benefiting from session memory and A2A routing.
//   3. If the orchestrator is not configured or errors → fall back to calling
//      Gemini 2.0 Flash directly via vertex-ai.ts (same model, no sub-agents).

import { NextRequest, NextResponse } from 'next/server';
import { callOrchestrator, isOrchestratorConfigured } from '@/lib/a2a-client';
import { generateContent } from '@/lib/vertex-ai';

// ─── Prompt builders ──────────────────────────────────────────

function buildStrategyPrompt(ctx: Record<string, unknown>): string {
  const formation     = (ctx.formation     as string) ?? 'unknown';
  const position      = (ctx.position      as string | undefined);
  const opponentNotes = (ctx.opponentNotes as string | undefined);

  return [
    'You are an expert youth soccer coach. A player is preparing for a match.',
    `Formation: ${formation}`,
    position      ? `Player position: ${position}`   : '',
    opponentNotes ? `Opponent notes: ${opponentNotes}` : '',
    '',
    'Give exactly 3 specific, actionable tactical recommendations tailored to this formation and position.',
    'Format as a numbered list (1. 2. 3.). Keep each point to 2 sentences max.',
    'Be practical, concise, and motivating — written directly to the player.',
  ].filter(Boolean).join('\n');
}

function buildAnalyticsPrompt(ctx: Record<string, unknown>): string {
  const goals   = ctx.goals   as number;
  const assists = ctx.assists as number;
  const games   = ctx.games   as number;
  const winRate = ctx.winRate as number;
  const range   = (ctx.range  as string) ?? 'the selected period';

  return [
    'You are a soccer performance analyst reviewing a youth athlete\'s stats.',
    `Period: ${range}`,
    `Stats — Goals: ${goals}, Assists: ${assists}, Games: ${games}, Win Rate: ${winRate}%`,
    '',
    'Provide 2–3 key insights about their performance trends.',
    'Highlight one clear strength and one concrete area to improve.',
    'Keep the tone data-driven yet encouraging. 4 sentences maximum total.',
  ].join('\n');
}

function buildTipPrompt(ctx: Record<string, unknown>): string {
  const workoutsCompleted = ctx.workoutsCompleted as number;
  const workoutsGoal      = ctx.workoutsGoal      as number;
  const practicesLogged   = ctx.practicesLogged   as number;
  const recentResults     = ctx.recentResults     as string | undefined;

  return [
    'You are a youth soccer coach delivering a daily motivational tip.',
    `Workouts completed this week: ${workoutsCompleted}/${workoutsGoal}`,
    `Practices logged: ${practicesLogged}`,
    recentResults ? `Recent results: ${recentResults}` : '',
    '',
    'Give ONE specific, actionable tip for today to improve performance.',
    'Be encouraging, practical, and brief — 2–3 sentences only.',
    'Address the player directly (use "you").',
  ].filter(Boolean).join('\n');
}

// ─── Route handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      type: 'strategy' | 'analytics' | 'tip';
      context: Record<string, unknown>;
    };

    const { type, context } = body;

    if (!type || !context) {
      return NextResponse.json({ error: 'Missing type or context' }, { status: 400 });
    }

    let prompt: string;
    if (type === 'strategy') {
      prompt = buildStrategyPrompt(context);
    } else if (type === 'analytics') {
      prompt = buildAnalyticsPrompt(context);
    } else if (type === 'tip') {
      prompt = buildTipPrompt(context);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    let result: string;

    console.log(`[/api/ai/recommend] type=${type} orchestrator=${isOrchestratorConfigured()}`);

    if (isOrchestratorConfigured()) {
      try {
        result = await callOrchestrator(prompt);
      } catch (orchError) {
        // Orchestrator unreachable or session error — degrade gracefully
        console.warn('[/api/ai/recommend] Orchestrator failed, falling back to direct Gemini:', orchError);
        result = await generateContent(prompt);
      }
    } else {
      result = await generateContent(prompt);
    }

    return NextResponse.json({ result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[/api/ai/recommend] ERROR:', msg);
    // Return the raw error in the response body so it's visible in browser DevTools
    return NextResponse.json(
      { error: 'AI request failed', detail: msg },
      { status: 500 },
    );
  }
}
