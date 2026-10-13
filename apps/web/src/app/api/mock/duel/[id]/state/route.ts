import { NextResponse } from 'next/server';
import { mockDuels, processRivalAiTurn, FeedEvent } from '../../duelStore';

// MOCK: replace with Supabase Realtime
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = mockDuels.get(id);

    if (!session) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
    }

    // Trigger AI move calculation if timer is due
    processRivalAiTurn(session);

    // Redact hidden guesses so digits never leak over the network
    const safeEvents: FeedEvent[] = session.events.map((e) => {
      if (e.hidden) {
        return {
          id: e.id,
          who: e.who,
          guess: null,
          pots: null,
          pans: null,
          hidden: true,
          t: e.t,
        };
      }
      return {
        id: e.id,
        who: e.who,
        guess: e.guess,
        pots: e.pots,
        pans: e.pans,
        hidden: false,
        t: e.t,
      };
    });

    return NextResponse.json({
      events: safeEvents,
      status: session.status,
      secret: session.status !== 'playing' ? session.secret : undefined,
      rivalAttemptsLeft: session.rival.attemptsLeft,
      playerAttemptsLeft: session.player.attemptsLeft,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching state' }, { status: 500 });
  }
}
