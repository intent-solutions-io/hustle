// A2A Orchestrator Client — Vertex AI Agent Engine (ADK)
//
// Calls the deployed hustle-operations-manager reasoning engine using the
// two-step session + streamQuery pattern confirmed working in
// vertex-agents/scout-team/test_scout_WORKING.py
//
// The Vertex AI Agent Engine REST API requires:
//   1. POST :query   {"class_method":"async_create_session","input":{"user_id":"..."}}
//      → {"output":{"id":"<session_id>"}}
//   2. POST :streamQuery?alt=sse  {"class_method":"async_stream_query","input":{...}}
//      → SSE stream of JSON objects: {"content":{"parts":[{"text":"..."}]}}
//
// Auth: same service-account credential used by vertex-ai.ts

import { cert } from 'firebase-admin/app';

// Numeric project number (required by the AI Platform API — not the project name).
// 335713777643 is the hustleapp-production project number confirmed in
// vertex-agents/scout-team/test_scout_WORKING.py
const PROJECT_NUMBER = process.env.VERTEX_AI_PROJECT_NUMBER ?? '335713777643';
const LOCATION       = process.env.VERTEX_AI_LOCATION       ?? 'us-central1';
const ENGINE_ID      = process.env.ORCHESTRATOR_REASONING_ENGINE_ID ?? '';

function engineBaseUrl(): string {
  return (
    `https://${LOCATION}-aiplatform.googleapis.com/v1` +
    `/projects/${PROJECT_NUMBER}/locations/${LOCATION}` +
    `/reasoningEngines/${ENGINE_ID}`
  );
}

// ─── Credential (shared with vertex-ai.ts via same env vars) ──
let _cred: ReturnType<typeof cert> | null = null;

function getCredential() {
  if (!_cred) {
    _cred = cert({
      projectId:   process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    });
  }
  return _cred;
}

async function getAccessToken(): Promise<string> {
  const { access_token } = await getCredential().getAccessToken();
  return access_token;
}

// ─── Step 1: create a session ─────────────────────────────────
async function createSession(token: string, userId: string): Promise<string> {
  const res = await fetch(`${engineBaseUrl()}:query`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      class_method: 'async_create_session',
      input: { user_id: userId },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`[A2A] Session creation failed ${res.status}: ${detail}`);
  }

  const data = await res.json() as { output: { id: string } };
  return data.output.id;
}

// ─── Step 2: stream query and collect text ────────────────────
async function streamQuery(
  token:     string,
  sessionId: string,
  userId:    string,
  message:   string,
): Promise<string> {
  const res = await fetch(`${engineBaseUrl()}:streamQuery?alt=sse`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      class_method: 'async_stream_query',
      input: { user_id: userId, session_id: sessionId, message },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`[A2A] Stream query failed ${res.status}: ${detail}`);
  }

  // Consume the SSE stream.
  // Each non-empty line is either:
  //   - raw JSON: {"content":{"parts":[{"text":"..."}]}}
  //   - SSE prefixed: data: {"content":{...}}
  // The Python test uses try/except to silently skip non-JSON lines, so we do the same.
  const reader = res.body?.getReader();
  if (!reader) throw new Error('[A2A] No response body');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });

    for (const line of chunk.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Strip optional SSE "data: " prefix
      const jsonStr = trimmed.startsWith('data: ')
        ? trimmed.slice(6)
        : trimmed;

      try {
        const event = JSON.parse(jsonStr) as {
          content?: { parts?: Array<{ text?: string }> };
        };
        const text = event.content?.parts?.[0]?.text;
        if (text) fullText += text;
      } catch {
        // non-JSON line (SSE comment, empty event, etc.) — skip
      }
    }
  }

  return fullText.trim();
}

// ─── Public API ───────────────────────────────────────────────

/** Returns true when ORCHESTRATOR_REASONING_ENGINE_ID is set. */
export function isOrchestratorConfigured(): boolean {
  return Boolean(ENGINE_ID);
}

/**
 * Send a natural-language message to the Operations Manager orchestrator
 * and return the full text response.
 *
 * Creates a new (stateless) session per request — sessions are ephemeral
 * for coaching insights; persistent sessions are only needed for multi-turn
 * operational workflows (user_registration, game_logging, etc.)
 */
export async function callOrchestrator(message: string): Promise<string> {
  if (!ENGINE_ID) {
    throw new Error('[A2A] ORCHESTRATOR_REASONING_ENGINE_ID is not set');
  }

  const token  = await getAccessToken();
  const userId = 'hustle-app';

  const sessionId = await createSession(token, userId);
  return streamQuery(token, sessionId, userId, message);
}
