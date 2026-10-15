import { NextResponse } from 'next/server';
import { mockCampaign } from '../../db';

// MOCK: Developer endpoint to bypass campaign gates
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const feature = body?.feature || 'blackMarket';

    if (feature === 'blackMarket' || feature === 'all') {
      mockCampaign.unlocks.blackMarket = true;
    }
    if (feature === 'onlinePlay' || feature === 'all') {
      mockCampaign.unlocks.onlinePlay = true;
    }
    if (feature === 'bridge' || feature === 'all') {
      mockCampaign.unlocks.bridge = true;
    }

    return NextResponse.json({
      success: true,
      unlocks: mockCampaign.unlocks,
      message: 'Feature unlocked successfully for developer testing.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unlock failed' }, { status: 500 });
  }
}
