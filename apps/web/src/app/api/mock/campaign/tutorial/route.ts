import { NextResponse } from 'next/server';
import { updateTutorialProgress } from '../../db';

// MOCK: replace with Supabase
export async function POST(request: Request) {
  try {
    const { chapterId, completed, skipped } = await request.json();
    if (!chapterId) {
      return NextResponse.json({ error: 'Missing chapterId parameter' }, { status: 400 });
    }
    const state = updateTutorialProgress(chapterId, { completed, skipped });
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update tutorial progress' }, { status: 500 });
  }
}
