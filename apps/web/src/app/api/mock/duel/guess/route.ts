import { NextResponse } from 'next/server';
import { submitDuelGuess } from '../../db';

// MOCK: replace with Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { duelId, guess, exploitUsed, isStealth } = body;

    if (!duelId || !guess) {
      return NextResponse.json({ error: 'Missing duelId or guess' }, { status: 400 });
    }

    const result = submitDuelGuess({
      duelId,
      guess,
      exploitUsed,
      isStealth,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit guess';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
