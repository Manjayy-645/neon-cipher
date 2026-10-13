// MOCK: replace with Supabase.
import { NextResponse } from 'next/server';
import { getActiveAccount, updateAccountSettings } from '../db';
import { AccountSettings } from '@/features/settings/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountHandle = searchParams.get('account');
  const account = getActiveAccount();
  return NextResponse.json(account.settings);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AccountSettings>;
    const updated = updateAccountSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 400 });
  }
}
