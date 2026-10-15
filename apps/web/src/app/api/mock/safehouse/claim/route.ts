import { NextResponse } from 'next/server';
import { mockSafehouses, mockWallet, recordTransaction } from '../../db';

// MOCK: replace with Supabase edge function.
export async function POST(request: Request) {
  try {
    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Missing propertyId parameter.' }, { status: 400 });
    }

    // Support claiming District Lease dividends
    if (propertyId === 'district-leases' || propertyId.startsWith('lease-')) {
      const leaseDividends: Record<string, { name: string; dividend: number }> = {
        'lease-slums-nodes': { name: 'Slums Public Node Lease', dividend: 250 },
        'lease-docklands-pier': { name: 'Docklands Freight Relays', dividend: 400 },
      };

      let toClaim = 0;
      let label = 'District Holdings';

      if (propertyId === 'district-leases') {
        for (const [id, info] of Object.entries(leaseDividends)) {
          if ((mockWallet.inventory[id] || 0) > 0) toClaim += info.dividend;
        }
      } else {
        const info = leaseDividends[propertyId];
        const owned = (mockWallet.inventory[propertyId] || 0) > 0;
        if (!owned) {
          return NextResponse.json(
            { error: `Cannot claim: You do not own lease ${propertyId}.` },
            { status: 400 }
          );
        }
        toClaim = info ? info.dividend : 250;
        label = info ? info.name : propertyId;
      }

      if (toClaim <= 0) {
        return NextResponse.json(
          { error: 'No active lease dividends available to claim.' },
          { status: 400 }
        );
      }

      recordTransaction(`Dividend: ${label}`, toClaim, 'credits', 'dividend');

      return NextResponse.json({
        success: true,
        claimedAmount: toClaim,
        balances: {
          credits: mockWallet.credits,
          coins: mockWallet.coins,
        },
        message: `Collected $${toClaim.toLocaleString()} in passive dividends from ${label}.`,
      });
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
