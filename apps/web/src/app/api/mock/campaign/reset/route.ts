import { NextResponse } from 'next/server';
import { resetCampaignProgress } from '../../db';

// MOCK: replace with Supabase
export async function POST() {
  try {
    const state = resetCampaignProgress();
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset campaign' }, { status: 500 });
  }
}
