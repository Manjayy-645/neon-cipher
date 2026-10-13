import { NextResponse } from 'next/server';
import { getCampaignState } from '../db';

// MOCK: replace with Supabase
export async function GET() {
  try {
    const state = getCampaignState();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch campaign' }, { status: 500 });
  }
}
