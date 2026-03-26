// Vertex AI REST client — calls Gemini 2.0 Flash via the Vertex AI generative AI API.
// Auth re-uses the Firebase Admin app credential so we share the token cache.

import { getAdminApp } from '@/lib/firebase/admin';

const PROJECT  = process.env.GOOGLE_CLOUD_PROJECT  ?? 'hustleapp-production';
const LOCATION = process.env.VERTEX_AI_LOCATION    ?? 'us-central1';
const MODEL    = 'gemini-2.0-flash-001';

const ENDPOINT =
  `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}` +
  `/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

async function getAccessToken(): Promise<string> {
  const app = getAdminApp();
  const { access_token } = await app.options.credential!.getAccessToken();
  if (!access_token) throw new Error('Firebase Admin credential returned empty access_token');
  return access_token;
}

export async function generateContent(prompt: string): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Vertex AI ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text.trim();
}
