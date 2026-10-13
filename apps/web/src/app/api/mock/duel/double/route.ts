import { NextResponse } from 'next/server';
import { triggerDoubleOrNothing } from '../../db';

// MOCK: replace with Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { duelId } = body;

    if (!duelId) {
      return NextResponse.json({ error: 'Missing duelId' }, { status: 400 });
    }

    const session = triggerDoubleOrNothing(duelId);
    const { secret: _, ...safeSession } = session;

    return NextResponse.json({
      success: true,
      session: safeSession,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to trigger double or nothing';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
