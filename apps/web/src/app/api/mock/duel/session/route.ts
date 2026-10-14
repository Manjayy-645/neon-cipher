import { NextResponse } from 'next/server';
import { startDuelSession, syncDuelClocks, toSafeDuelSession } from '../../db';

// MOCK: replace with Supabase edge function
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      matchType = 'casual',
      pacingMode = 'simultaneous',
      wager = 0,
      ante,
      roomId,
      playerHandle,
    } = body;

    const session = startDuelSession({
      matchType,
      pacingMode,
      wager,
      ante,
      roomId,
      playerHandle,
    });

    // RULE 1: Never leak the secret code to the client while game is active
    const safeSession = toSafeDuelSession(session);
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

  const safeSession = syncDuelClocks(duelId);
  if (!safeSession) return NextResponse.json({ error: 'Duel not found' }, { status: 404 });

  return NextResponse.json({ success: true, session: safeSession });
}
