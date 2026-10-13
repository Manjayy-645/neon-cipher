import { NextResponse } from 'next/server';
import { createDuelSession } from './duelStore';
import { getNodes } from '@/features/map/nodeService';

// MOCK: replace with Supabase Realtime
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let tier = 2;

    if (body.tier) {
      tier = Number(body.tier);
    } else if (body.nodeId) {
      const node = getNodes().find((n) => n.id === body.nodeId);
      if (node) tier = node.tier;
    }

    const session = createDuelSession(tier);

    return NextResponse.json({
      duelId: session.duelId,
      config: session.config,
      startedAt: session.startedAt,
      rival: { handle: session.rival.handle },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to start duel' }, { status: 500 });
  }
}
