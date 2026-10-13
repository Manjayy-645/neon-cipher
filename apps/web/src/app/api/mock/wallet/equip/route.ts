import { NextResponse } from 'next/server';
import { mockWallet } from '../../db';
import { CATALOG } from '@/features/market/catalog';

// MOCK: replace with Supabase edge function.
export async function POST(request: Request) {
  try {
    const { toolIds } = await request.json();

    if (!Array.isArray(toolIds)) {
      return NextResponse.json({ error: 'toolIds must be an array.' }, { status: 400 });
    }

    if (toolIds.length > 2) {
      return NextResponse.json(
        { error: 'Rig limits allow equipping a maximum of two consumable tools per intrusion.' },
        { status: 400 }
      );
    }

    // Validate that each tool exists in catalog under 'tools' and is owned
    for (const toolId of toolIds) {
      const item = CATALOG.find((it) => it.id === toolId);
      if (!item || item.category !== 'tools') {
        return NextResponse.json(
          { error: `Item ${toolId} is not a valid consumable tool.` },
          { status: 400 }
        );
      }

      const owned = mockWallet.inventory[toolId] || 0;
      if (owned <= 0) {
        return NextResponse.json(
          { error: `Cannot equip ${item.name}: You do not have any in your inventory.` },
          { status: 400 }
        );
      }
    }

    mockWallet.equippedTools = [...toolIds];

    return NextResponse.json({
      success: true,
      equippedTools: mockWallet.equippedTools,
      message: `Equipped ${mockWallet.equippedTools.length} tool(s) for the next breach.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Equip update failed.' }, { status: 500 });
  }
}
