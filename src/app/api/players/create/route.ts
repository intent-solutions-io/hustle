import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from NextAuth session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, birthday, position, teamClub } = body;

    // Validate required fields
    if (!name || !birthday || !position || !teamClub) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create player with authenticated user as parent
    const player = await prisma.player.create({
      data: {
        name,
        birthday: new Date(birthday),
        position,
        teamClub,
        parentId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      player,
    });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
