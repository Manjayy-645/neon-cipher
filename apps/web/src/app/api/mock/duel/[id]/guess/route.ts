import { NextResponse } from 'next/server';
import { mockDuels, InternalFeedEvent } from '../../duelStore';
import { scoreGuess, validateGuess } from '@neon-cipher/game-rules';

// MOCK: replace with Supabase Realtime
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = mockDuels.get(id);

    if (!session) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
    }

    if (session.status !== 'playing') {
      return NextResponse.json(
        {
          error: 'Duel already resolved',
          status: session.status,
          secret: session.secret,
        },
        { status: 400 }
      );
    }

    const { guess } = await request.json();
    if (!guess) {
      return NextResponse.json({ error: 'Missing guess' }, { status: 400 });
    }

    const guessArray: number[] = Array.isArray(guess)
      ? guess.map(Number)
      : String(guess).split('').map(Number);

    const guessStr = guessArray.join('');
    const isValid = validateGuess(
      guessStr,
      session.config.length,
      session.config.allowDuplicates
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid guess format' }, { status: 400 });
    }

    const score = scoreGuess(session.secret, guessArray);
    const now = Date.now();
    session.player.attemptsLeft = Math.max(0, session.player.attemptsLeft - 1);

    const isWin = score.pans === session.config.length;
    if (isWin) {
      session.status = 'won';
    } else if (session.player.attemptsLeft <= 0 && session.rival.attemptsLeft <= 0) {
      session.status = 'lost';
    }

    const event: InternalFeedEvent = {
      id: `e-you-${now}-${Math.random().toString(36).slice(2, 6)}`,
      who: 'you',
      guess: guessArray,
      pots: score.pots,
      pans: score.pans,
      hidden: false,
      t: now - session.startedAt,
    };
    session.events.push(event);

    return NextResponse.json({
      pots: score.pots,
      pans: score.pans,
      status: session.status,
      secret: session.status !== 'playing' ? session.secret : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error processing guess' }, { status: 500 });
  }
}
