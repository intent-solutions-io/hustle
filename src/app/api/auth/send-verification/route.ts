import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { sendVerificationEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const { uid, email, firstName } = await req.json() as {
      uid: string;
      email: string;
      firstName?: string;
    };

    if (!uid || !email) {
      return NextResponse.json({ error: 'uid and email are required' }, { status: 400 });
    }

    const link = await getAdminAuth().generateEmailVerificationLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    });

    await sendVerificationEmail(email, firstName ?? 'there', link);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[send-verification]', detail);
    return NextResponse.json({ error: 'Failed to send verification email', detail }, { status: 500 });
  }
}
