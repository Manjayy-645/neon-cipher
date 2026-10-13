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

    if (prop.owned) {
      return NextResponse.json(
        { error: `You already own ${prop.name}.` },
        { status: 400 }
      );
    }

    if (mockWallet.credits < prop.cost) {
      const shortfall = prop.cost - mockWallet.credits;
      return NextResponse.json(
        {
          error: `Insufficient credits to acquire ${prop.name}. Short by $${shortfall.toLocaleString()} credits.`,
          shortfall,
        },
        { status: 400 }
      );
    }

    // Deduct cost and set owned
    recordTransaction(`Safehouse: ${prop.name}`, -prop.cost, 'credits', 'safehouse');
    prop.owned = true;
    prop.lastClaimedAt = Date.now();
    prop.accumulatedDividends = 0;

    return NextResponse.json({
      success: true,
      property: prop,
      balances: {
        credits: mockWallet.credits,
        coins: mockWallet.coins,
      },
      message: `Acquired ${prop.name}. Safehouse online and RF trace reduction active.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Safehouse acquisition failed.' }, { status: 500 });
  }
}
