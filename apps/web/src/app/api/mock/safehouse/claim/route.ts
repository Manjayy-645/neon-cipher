import { NextResponse } from 'next/server';
import { mockSafehouses, mockWallet, recordTransaction } from '../../db';

// MOCK: replace with Supabase edge function.
export async function POST(request: Request) {
  try {
    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Missing propertyId parameter.' }, { status: 400 });
    }

    const prop = mockSafehouses[propertyId];
    if (!prop) {
      return NextResponse.json({ error: 'Safehouse property not found.' }, { status: 404 });
    }

    if (!prop.owned) {
      return NextResponse.json(
        { error: `Cannot claim dividends: You do not own ${prop.name}.` },
        { status: 400 }
      );
    }

    // Calculate dividend: stored accumulated dividends plus time-based ticks
    // For test convenience, ensure at least $150 if accumulated is small
    const toClaim = Math.max(150, prop.accumulatedDividends || Math.floor(prop.dailyDividend / 2));

    recordTransaction(`Dividend: ${prop.name}`, toClaim, 'credits', 'dividend');
    prop.accumulatedDividends = 0;
    prop.lastClaimedAt = Date.now();

    return NextResponse.json({
      success: true,
      claimedAmount: toClaim,
      property: prop,
      balances: {
        credits: mockWallet.credits,
        coins: mockWallet.coins,
      },
      message: `Collected $${toClaim.toLocaleString()} in passive dividends from ${prop.name}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Dividend collection failed.' }, { status: 500 });
  }
}
