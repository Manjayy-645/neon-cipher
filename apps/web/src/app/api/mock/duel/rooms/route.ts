import { NextResponse } from 'next/server';
import { getDuelRooms, createDuelRoom } from '../../db';

// MOCK: replace with Supabase
export async function GET() {
  try {
    const rooms = getDuelRooms();
    return NextResponse.json({ success: true, rooms });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rooms';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, matchType, wager, ante, host } = body;
    if (!name || !matchType || wager === undefined) {
      return NextResponse.json({ error: 'Missing required room fields' }, { status: 400 });
    }
    const room = createDuelRoom({ name, matchType, wager, ante, host });
    return NextResponse.json({ success: true, room });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create room';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
