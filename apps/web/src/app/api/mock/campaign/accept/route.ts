import { NextResponse } from 'next/server';
import { acceptChapterAssignment } from '../../db';

// MOCK: replace with Supabase
export async function POST(request: Request) {
  try {
    const { chapterId } = await request.json();
    if (!chapterId) {
      return NextResponse.json({ error: 'Missing chapterId parameter' }, { status: 400 });
    }
    const state = acceptChapterAssignment(chapterId);
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to accept chapter' }, { status: 500 });
  }
}
