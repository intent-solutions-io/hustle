import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { sendPasswordResetEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string };

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const link = await getAdminAuth().generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    });

    await sendPasswordResetEmail(email, link);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[send-password-reset]', err);
    // Don't leak whether the email exists — return 200 regardless
    return NextResponse.json({ ok: true });
  }
}
