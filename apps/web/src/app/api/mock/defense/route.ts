import { NextResponse } from 'next/server';
import {
  getNodeDefense,
  getAllNodeDefenses,
  setNodeDefense,
  claimNodeIncome,
  getActiveAccount,
  activeAccountId,
} from '../db';
import { isCommonWeakCode, estimateCodeDifficulty, calculateNodeDecay, calculateNodeIncome } from '@neon-cipher/game-rules/src/index';
import { getNodes } from '@/features/map/nodeService';

// MOCK: replace with Supabase
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');

    if (nodeId) {
      const defense = getNodeDefense(nodeId);
      if (!defense) {
        return NextResponse.json({ error: 'Defense not found' }, { status: 404 });
      }
      const node = getNodes().find((n) => n.id === nodeId);
      const hourlyYield = node ? Math.floor(node.bounty / 2) : 100;
      const decay = calculateNodeDecay(defense.lastMaintainedAt, Date.now(), defense.dailyBudget);
      const income = calculateNodeIncome(hourlyYield, defense.lastCollectedAt, Date.now(), 1000);
      const difficulty = estimateCodeDifficulty(defense.code, node?.allowDuplicates ?? false, defense.iceModifiers);

      return NextResponse.json({
        defense,
        decay,
        income,
        difficulty,
      });
    }

    const allDefenses = getAllNodeDefenses();
    const enriched: Record<string, any> = {};
    const nodes = getNodes();

    for (const [id, def] of Object.entries(allDefenses)) {
      const node = nodes.find((n) => n.id === id);
      const hourlyYield = node ? Math.floor(node.bounty / 2) : 100;
      enriched[id] = {
        ...def,
        decay: calculateNodeDecay(def.lastMaintainedAt, Date.now(), def.dailyBudget),
        income: calculateNodeIncome(hourlyYield, def.lastCollectedAt, Date.now(), 1000),
      };
    }

    return NextResponse.json({ defenses: enriched, activeAccount: getActiveAccount().handle });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, nodeId, code, ice, iceModifiers, dailyBudget } = body;

    if (!nodeId) {
      return NextResponse.json({ error: 'Missing nodeId' }, { status: 400 });
    }

    const account = getActiveAccount();

    if (action === 'claim') {
      const result = claimNodeIncome(nodeId, account.handle);
      return NextResponse.json({ success: true, ...result });
    }

    // Setting/updating defense
    if (code) {
      const weakCheck = isCommonWeakCode(code);
      const node = getNodes().find((n) => n.id === nodeId);
      const difficulty = estimateCodeDifficulty(code, node?.allowDuplicates ?? false, iceModifiers || (ice ? [ice] : []));

      const updated = setNodeDefense(nodeId, {
        code,
        ice: ice || 'None',
        iceModifiers: iceModifiers || (ice ? [ice] : []),
        dailyBudget: typeof dailyBudget === 'number' ? dailyBudget : 150,
        ownerHandle: account.handle,
      });

      return NextResponse.json({
        success: true,
        defense: updated,
        warning: weakCheck.warning,
        difficulty,
      });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
