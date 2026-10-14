import { NextResponse } from 'next/server';
import {
  submitCoopGuess,
  simulatePartnerBetaStage,
  pingCoopDigit,
  flushCoopIce,
  triggerCoopOverdrive,
  tickCoopSync,
} from '../../db';

// MOCK: replace with Supabase Edge Functions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, role, guess, simulatePartner, action, digit, deltaMs } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    if (action === 'ping') {
      const result = pingCoopDigit(sessionId, Number(digit));
      return NextResponse.json({
        success: true,
        session: result.session,
        status: result.status,
        message: result.message,
        event: result.event,
      });
    }

    if (action === 'flush') {
      const result = flushCoopIce(sessionId);
      return NextResponse.json({
        success: true,
        session: result.session,
        message: result.message,
        event: result.event,
      });
    }

    if (action === 'overdrive') {
      const result = triggerCoopOverdrive(sessionId);
      return NextResponse.json({
        success: true,
        session: result.session,
        message: result.message,
        event: result.event,
      });
    }

    if (action === 'sync_tick') {
      const result = tickCoopSync(sessionId, Number(deltaMs || 1000));
      return NextResponse.json({
        success: true,
        session: result?.session,
        reset: result?.reset,
        event: result?.event,
      });
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
      event: result.event,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit co-op guess';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

