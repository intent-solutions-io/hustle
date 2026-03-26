import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 6;

function validatePin(pin: string) {
  const trimmed = pin.trim();
  if (trimmed.length < PIN_MIN_LENGTH || trimmed.length > PIN_MAX_LENGTH) {
    return `PIN must be ${PIN_MIN_LENGTH}-${PIN_MAX_LENGTH} digits`;
  }
  if (!/^\d+$/.test(trimmed)) {
    return 'PIN can only contain digits 0-9';
  }
  return null;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      verificationPinHash: true,
      email: true,
      firstName: true,
    },
  });

  return NextResponse.json({
    hasPin: Boolean(user?.verificationPinHash),
    email: user?.email ?? null,
    firstName: user?.firstName ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const pin: string | undefined = body?.pin;
    const confirmPin: string | undefined = body?.confirmPin;

    if (!pin || !confirmPin) {
      return NextResponse.json({ error: 'PIN and confirmation are required' }, { status: 400 });
    }

    if (pin !== confirmPin) {
      return NextResponse.json({ error: 'PINs do not match' }, { status: 400 });
    }

    const validationError = validatePin(pin);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        verificationPinHash: hashedPin,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PIN Settings] Failed to update PIN', error);
    return NextResponse.json({ error: 'Failed to update PIN' }, { status: 500 });
  }
}
