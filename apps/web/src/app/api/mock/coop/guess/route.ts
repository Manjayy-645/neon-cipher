import { NextResponse } from 'next/server';
import { submitCoopGuess, simulatePartnerBetaStage } from '../../db';

// MOCK: replace with Supabase Edge Functions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, role, guess, simulatePartner } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    if (simulatePartner) {
      const result = simulatePartnerBetaStage(sessionId);
      return NextResponse.json({
        success: true,
        session: result.session,
        guessRecord: result.guessRecord,
        rewardMessage: result.rewardMessage,
      });
    }

    if (!role || !guess) {
      return NextResponse.json({ error: 'Missing role or guess' }, { status: 400 });
    }

    const result = submitCoopGuess({ sessionId, role, guess });
    return NextResponse.json({
      success: true,
      session: result.session,
      guessRecord: result.guessRecord,
      rewardMessage: result.rewardMessage,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit co-op guess';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
