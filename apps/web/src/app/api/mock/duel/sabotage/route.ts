import { NextResponse } from 'next/server';
import { applyDuelSabotage } from '../../db';

// MOCK: replace with Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { duelId, toolId } = body;

    if (!duelId || !toolId) {
      return NextResponse.json({ error: 'Missing duelId or toolId' }, { status: 400 });
    }

    const result = applyDuelSabotage({
      duelId,
      toolId,
    });

    return NextResponse.json({
      ...result,
      success: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to apply sabotage';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
