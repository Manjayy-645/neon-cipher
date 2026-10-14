import { NextResponse } from 'next/server';
import { mockRigHardware, mockWallet, recordTransaction } from '../../db';

// MOCK: replace with Supabase edge function.
export async function POST(request: Request) {
  try {
    const { hardwareId } = await request.json();

    if (!hardwareId) {
      return NextResponse.json({ error: 'Missing hardwareId parameter.' }, { status: 400 });
    }

    const item = mockRigHardware[hardwareId];
    if (!item) {
      return NextResponse.json({ error: 'Hardware part not found.' }, { status: 404 });
    }

    if (!item.burned) {
      return NextResponse.json(
        { error: `${item.name} is in nominal operational condition and does not require repair.` },
        { status: 400 }
      );
    }

    if (mockWallet.credits < item.repairCost) {
      const shortfall = item.repairCost - mockWallet.credits;
      return NextResponse.json(
        {
          error: `Insufficient credits to repair ${item.name}. Short by $${shortfall.toLocaleString()} credits.`,
          shortfall,
        },
        { status: 400 }
      );
    }

    // Deduct repair cost and restore item
    recordTransaction(`Repair: ${item.name}`, -item.repairCost, 'credits', 'repair');
    item.burned = false;

    // Sync alias in mockRigHardware
    const aliasMap: Record<string, string> = {
      'rig-memory-buffer-1': 'memory_buffer_mk1',
      'memory_buffer_mk1': 'rig-memory-buffer-1',
      'rig-memory-buffer-2': 'memory_buffer_mk2',
      'memory_buffer_mk2': 'rig-memory-buffer-2',
      'rig-heuristic-coprocessor': 'heuristic_coproc',
      'heuristic_coproc': 'rig-heuristic-coprocessor',
    };
    const alias = aliasMap[hardwareId];
    if (alias && mockRigHardware[alias]) {
      mockRigHardware[alias].burned = false;
    }

    return NextResponse.json({
      success: true,
      hardware: item,
      balances: {
        credits: mockWallet.credits,
        coins: mockWallet.coins,
      },
      message: `Repaired ${item.name}. Bus rails restored to full operational status.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Repair failed.' }, { status: 500 });
  }
}
