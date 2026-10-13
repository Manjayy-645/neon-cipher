import { NextResponse } from 'next/server';
import { startDuelSession, mockDuelSessions } from '../../db';

// MOCK: replace with Supabase edge function
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matchType = 'casual', wager = 0, ante, roomId, playerHandle } = body;

    const session = startDuelSession({
      matchType,
      wager,
      ante,
      roomId,
      playerHandle,
    });

    // RULE 1: Never leak the secret code to the client while game is active
    const { secret: _, ...safeSession } = session;
    return NextResponse.json({ success: true, session: safeSession });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start duel session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const duelId = searchParams.get('duelId');
  if (!duelId) return NextResponse.json({ error: 'Missing duelId' }, { status: 400 });

  const session = mockDuelSessions.get(duelId);
  if (!session) return NextResponse.json({ error: 'Duel not found' }, { status: 404 });

  // Only return secret if session is finished
  if (session.status === 'active') {
    const { secret: _, ...safeSession } = session;
    return NextResponse.json({ success: true, session: safeSession });
  }
  return NextResponse.json({ success: true, session });
}
