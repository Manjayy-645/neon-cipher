import { NextResponse } from 'next/server';
import {
  pingCoopDigit,
  flushCoopIce,
  triggerCoopOverdrive,
  tickCoopSync,
} from '../../db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, action, digit, deltaMs } = body;

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

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Action failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
