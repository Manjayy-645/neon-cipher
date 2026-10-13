import { NextResponse } from 'next/server';
import { completeChapterAssignment } from '../../db';

// MOCK: replace with Supabase
export async function POST(request: Request) {
  try {
    const { chapterId } = await request.json();
    if (!chapterId) {
      return NextResponse.json({ error: 'Missing chapterId parameter' }, { status: 400 });
    }
    const result = completeChapterAssignment(chapterId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to complete chapter' }, { status: 500 });
  }
}
