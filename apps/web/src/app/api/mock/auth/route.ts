// MOCK: replace with Supabase.
import { NextResponse } from 'next/server';
import { getActiveAccount, createAccount, setActiveAccount, mockAccounts } from '../db';

export async function GET() {
  const account = getActiveAccount();
  return NextResponse.json({
    profile: {
      id: account.id,
      handle: account.handle,
      avatarUrl: account.avatarUrl,
      createdAt: account.createdAt,
    },
    settings: account.settings,
    wallet: account.wallet,
  });
}

export async function POST(request: Request) {
  try {
    const { handle, avatarUrl } = await request.json();
    if (!handle || typeof handle !== 'string') {
      return NextResponse.json({ error: 'Callsign is required' }, { status: 400 });
    }
    const cleanHandle = handle.trim().toUpperCase();
    if (cleanHandle.length < 3 || cleanHandle.length > 12) {
      return NextResponse.json({ error: 'Callsign must be 3-12 characters' }, { status: 400 });
    }
    if (!/^[A-Z0-9_]+$/.test(cleanHandle)) {
      return NextResponse.json({ error: 'Callsign may only contain letters, numbers, and underscores' }, { status: 400 });
    }

    const account = createAccount(cleanHandle, avatarUrl || '/Character portraits/Player avatars.png');
    return NextResponse.json({
      profile: {
        id: account.id,
        handle: account.handle,
        avatarUrl: account.avatarUrl,
        createdAt: account.createdAt,
      },
      settings: account.settings,
      wallet: account.wallet,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 400 });
  }
}

export async function DELETE() {
  // Mock logout - switches back to default guest profile
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
