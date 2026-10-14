// MOCK: replace with Supabase.
import { NextResponse } from 'next/server';
import { resetAccountCampaign, resetCampaignProgress } from '../../db';

export async function POST() {
  try {
    const updated = resetAccountCampaign();
    const campaign = resetCampaignProgress();
    return NextResponse.json({
      success: true,
      account: {
        id: updated.id,
        handle: updated.handle,
        wallet: updated.wallet,
        campaignProgress: updated.campaignProgress,
      },
      campaign,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset campaign' }, { status: 400 });
  }
}
