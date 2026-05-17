export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ ok: true, ts: new Date().toISOString() });
}
