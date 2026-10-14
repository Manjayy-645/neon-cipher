import { NextResponse } from 'next/server';
import { mockWallet, recordTransaction, mockRigHardware, mockSafehouses, mockCampaign } from '../../db';
import { CATALOG } from '@/features/market/catalog';

// MOCK: replace with Supabase edge function.
export async function POST(request: Request) {
  try {
    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Missing itemId parameter.' }, { status: 400 });
    }

    const item = CATALOG.find((it) => it.id === itemId);
    if (!item) {
      return NextResponse.json({ error: 'Item not found in catalog.' }, { status: 404 });
    }

    // Story / Chapter progression gating check
    if (item.tierRequired) {
      const requiredChapterId = `chapter-${item.tierRequired}`;
      const chapterProg = mockCampaign.chapters[requiredChapterId];
      if (!chapterProg || chapterProg.status !== 'completed') {
        return NextResponse.json(
          {
            error: `Security lockout: ${item.name} requires clearing Chapter ${item.tierRequired}.`,
          },
          { status: 403 }
        );
      }
    }

    const currentOwned = mockWallet.inventory[item.id] || 0;
    if (item.maxOwned !== undefined && currentOwned >= item.maxOwned) {
      return NextResponse.json(
        {
          error: `You already own the maximum allowed quantity of ${item.name}.`,
          shortfall: 0,
        },
        { status: 400 }
      );
    }

    const currentBalance = mockWallet[item.currency];
    if (currentBalance < item.price) {
      const shortfall = item.price - currentBalance;
      const currencyLabel = item.currency === 'credits' ? `$${shortfall} credits` : `${shortfall} coins`;
      return NextResponse.json(
        {
          error: `Insufficient ${item.currency}. You are short by ${currencyLabel}.`,
          shortfall,
          currency: item.currency,
          required: item.price,
          current: currentBalance,
        },
        { status: 400 }
      );
    }

    // Deduct via transaction recorder and update server inventory
    recordTransaction(`Market: ${item.name}`, -item.price, item.currency, 'purchase');
    mockWallet.inventory[item.id] = currentOwned + 1;

    // If purchased item is permanent rig hardware
    if (item.category === 'rig') {
      if (mockRigHardware[item.id]) {
        mockRigHardware[item.id].burned = false;
      }
      if (item.railSlot) {
        if (!mockWallet.equippedRails) {
          mockWallet.equippedRails = {
            memory_1: null,
            memory_2: null,
            coprocessor: null,
            bus_interconnect: null,
          };
        }
        // If this rail slot is currently empty, auto-slot it
        if (!mockWallet.equippedRails[item.railSlot]) {
          mockWallet.equippedRails[item.railSlot] = item.id as any;
          if (mockRigHardware[item.id]) {
            mockRigHardware[item.id].installed = true;
          }
        }
      } else if (mockRigHardware[item.id]) {
        mockRigHardware[item.id].installed = true;
      }
    }

    // If purchased item is a district lease or safehouse
    if (item.id === 'rig-safehouse-slums' && mockSafehouses['safehouse-slums']) {
      mockSafehouses['safehouse-slums'].owned = true;
    }

    return NextResponse.json({
      success: true,
      balances: {
        credits: mockWallet.credits,
        coins: mockWallet.coins,
      },
      inventory: mockWallet.inventory,
      purchasedItem: item,
      message: `Acquired ${item.name}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Purchase processing failed.' }, { status: 500 });
  }
}
