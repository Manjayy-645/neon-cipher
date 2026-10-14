import { NextResponse } from 'next/server';
import { mockSessions, mockRigHardware, mockCampaign, getNodeDefense } from '../db';
import type { Session } from '../db';
import { generateCode, getChapterById } from '@neon-cipher/game-rules/src/index';
import { getNodes, getNodeById } from '@/features/map/nodeService';
import { NIX_RECOVERY_NODE_ID } from '@/features/story/recoveryQuest';

// MOCK: replace with Supabase edge function.
export async function POST(request: Request) {
  try {
    const { nodeId, courtesy } = await request.json();
    if (!nodeId) return NextResponse.json({ error: 'Missing nodeId' }, { status: 400 });

    if (nodeId === NIX_RECOVERY_NODE_ID) {
      const sessionId = Math.random().toString(36).substring(2, 15);
      const session: Session = {
        id: sessionId,
        nodeId: NIX_RECOVERY_NODE_ID,
        secret: generateCode(3, false),
        attemptsLeft: 999,
        startedAt: Date.now(),
        status: 'active',
        node: {
          id: NIX_RECOVERY_NODE_ID,
          name: "Nix's Recovery Run",
          type: 'vending',
          tier: 1,
          district: 'slums',
          x: 20,
          y: 12,
          digits: 3,
          allowDuplicates: false,
          attempts: 999,
          timerSeconds: 0,
          bounty: 0,
          traceRisk: 0,
          status: 'available',
          requiresUnlock: false,
        },
        eliminatedDigits: [],
        ice: 'None',
        recovery: true,
      };

      mockSessions.set(sessionId, session);

      return NextResponse.json({
        sessionId,
        config: {
          length: 3,
          digits: 3,
          allowDuplicates: false,
          attempts: 999,
          maxAttempts: 999,
          timerSeconds: 0,
          tier: 1,
          ice: 'None',
          eliminatedDigits: [],
          nodeName: "Nix's Recovery Run",
          nodeType: 'vending',
          bounty: 0,
          district: 'slums',
        },
        startedAt: session.startedAt,
      });
    }

    if (nodeId === 'tutorial-soda') {
      const sessionId = Math.random().toString(36).substring(2, 15);
      const secret = generateCode(3, false);
      const session = {
        id: sessionId,
        nodeId: 'tutorial-soda',
        secret,
        attemptsLeft: 999,
        startedAt: Date.now(),
        status: 'active' as const,
        node: {
          id: 'tutorial-soda',
          name: 'Rusty Soda Machine',
          type: 'vending' as const,
          tier: 1,
          district: 'slums' as const,
          x: 20,
          y: 12,
          digits: 3,
          allowDuplicates: false,
          attempts: 999,
          timerSeconds: 0,
          bounty: 120,
          traceRisk: 0,
          status: 'available' as const,
          requiresUnlock: false,
        },
        eliminatedDigits: [],
        ice: 'None' as const,
        courtesy: Boolean(courtesy),
        courtesyUsed: false,
      };

      mockSessions.set(sessionId, session as any);

      return NextResponse.json({
        sessionId,
        config: {
          length: 3,
          digits: 3,
          allowDuplicates: false,
          attempts: null,
          maxAttempts: null,
          timerSeconds: null,
          tier: 1,
          ice: 'None',
          eliminatedDigits: [],
          nodeName: 'Rusty Soda Machine',
          nodeType: 'vending',
          bounty: 120,
          district: 'slums',
        },
        startedAt: session.startedAt,
      });
    }

    const nodes = getNodes();
    const node = getNodeById(nodeId) || nodes.find((n) => n.id === nodeId);
    if (!node) return NextResponse.json({ error: 'Node not found' }, { status: 404 });

    // Use node's challenge parameters so terminal matches the marker/sheet
    const digits = node.digits;
    const allowDuplicates = node.allowDuplicates;
    const baseAttempts = node.attempts;
    const timerSeconds = node.timerSeconds;

    // Check if node is part of the active campaign chapter for ICE
    const activeChapter = mockCampaign.activeChapterId
      ? getChapterById(mockCampaign.activeChapterId)
      : null;
    const isCampaignTarget = activeChapter && activeChapter.mapNodeId === node.id;
    const iceTypeFromCampaign = isCampaignTarget ? activeChapter.rules.ice : undefined;

    // Check if node has a custom defense deployed by a player/decker
    const defense = getNodeDefense(node.id);
    const configuredCode = defense ? defense.code : null;

    const sessionId = Math.random().toString(36).substring(2, 15);
    const secret = configuredCode || generateCode(digits, allowDuplicates);

    // --- APPLY INSTALLED RIG UPGRADES (SERVER-SIDE DECISION) ---
    let totalAttempts = baseAttempts;

    // Memory Buffer Mk I (+1 attempt on Tiers 1 and 2)
    const mb1 = mockRigHardware['rig-memory-buffer-1'];
    if (mb1 && mb1.installed && !mb1.burned && node.tier <= 2) {
      totalAttempts += 1;
    }

    // Memory Buffer Mk II (+1 attempt on Tiers 3 and 4)
    const mb2 = mockRigHardware['rig-memory-buffer-2'];
    if (mb2 && mb2.installed && !mb2.burned && (node.tier === 3 || node.tier === 4)) {
      totalAttempts += 1;
    }

    // Heuristic Co-Processor (pre-removes two non-code digits at start)
    let eliminatedDigits: string[] = [];
    const coProcessor = mockRigHardware['rig-heuristic-coprocessor'];
    if (coProcessor && coProcessor.installed && !coProcessor.burned) {
      const allDigits = '0123456789'.split('');
      const nonCodeDigits = allDigits.filter((d) => !secret.includes(d));
      // Shuffle and pick up to 2
      const shuffled = nonCodeDigits.sort(() => Math.random() - 0.5);
      eliminatedDigits = shuffled.slice(0, 2);
    }

    const sessionNode = {
      ...node,
      digits,
      allowDuplicates,
      attempts: totalAttempts,
      timerSeconds,
    };

    const iceTypes = ['Liar', 'Drift', 'Pot-only', 'Ghost', 'Sticky', 'None'] as const;
    const configuredIce = defense?.ice && defense.ice !== 'None' ? defense.ice : undefined;
    const activeIce = configuredIce || iceTypeFromCampaign || (node.tier >= 3 ? iceTypes[Math.floor(Math.random() * 5)] : 'None');

    const session = {
      id: sessionId,
      nodeId: node.id,
      secret,
      attemptsLeft: totalAttempts,
      startedAt: Date.now(),
      status: 'active' as const,
      node: sessionNode,
      eliminatedDigits,
      ice: activeIce,
      courtesy: Boolean(courtesy),
      courtesyUsed: false,
    };

    mockSessions.set(sessionId, session as any);

    return NextResponse.json({
      sessionId,
      config: {
        length: digits,
        digits,
        allowDuplicates,
        attempts: totalAttempts,
        maxAttempts: totalAttempts,
        timerSeconds,
        tier: node.tier,
        ice: activeIce,
        eliminatedDigits,
        nodeName: node.name,
        nodeType: node.type,
        bounty: node.bounty,
        district: node.district,
      },
      startedAt: session.startedAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
