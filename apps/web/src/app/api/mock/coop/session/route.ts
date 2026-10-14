import { NextResponse } from 'next/server';
import {
  startCoopSession,
  mockCoopSessions,
  getSafeCoopSession,
} from '../../db';

// MOCK: replace with Supabase Realtime Channels / Edge Functions
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { playerRole, difficulty, initialAlphaSecret, initialBetaSecrets } = body;

    const session = startCoopSession({
      playerRole,
      difficulty,
      initialAlphaSecret,
      initialBetaSecrets,
    });

    // RULE 1: Never leak secrets to client while active
    const safeSession = getSafeCoopSession(session);
    return NextResponse.json({ success: true, session: safeSession });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start co-op session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const session = mockCoopSessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Co-op session not found' }, { status: 404 });
  }

  const safeSession = getSafeCoopSession(session);
  return NextResponse.json({ success: true, session: safeSession });
}
