import { NextResponse } from 'next/server';
import { mockSessions, mockRigHardware, mockCampaign, mockWallet, getNodeDefense } from '../db';
import type { Session } from '../db';
import {
  generateCode,
  getChapterById,
  computeEffectiveRigStats,
  calculateParityDistribution,
  normalizeHardwareId,
  HardwareRailSlot,
  RigHardwareId,
} from '@neon-cipher/game-rules';
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
      // Fixed secret without 1, 2, or 3 so Nix's tutorial prompt to type '1-2-3' guarantees 0 pans 0 pots
      const secret = '489';
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

    // Check if node is part of the active campaign chapter for rules & ICE
    const activeChapter = mockCampaign.activeChapterId
      ? getChapterById(mockCampaign.activeChapterId)
      : null;
    const isCampaignTarget = activeChapter && activeChapter.mapNodeId === node.id;
    const iceTypeFromCampaign = isCampaignTarget ? activeChapter.rules.ice : undefined;

    // Use chapter challenge parameters if attacking active campaign target, else node parameters
    const digits = isCampaignTarget && activeChapter ? activeChapter.rules.digits : node.digits;
    const allowDuplicates = isCampaignTarget && activeChapter ? activeChapter.rules.allowDuplicates : node.allowDuplicates;
    const baseAttempts = isCampaignTarget && activeChapter ? activeChapter.rules.attempts : node.attempts;
    const timerSeconds = isCampaignTarget && activeChapter ? activeChapter.rules.timerSeconds : node.timerSeconds;

    // Check if node has a custom defense deployed by a player/decker
    const defense = getNodeDefense(node.id);
    const configuredCode = defense ? defense.code : null;

    const sessionId = Math.random().toString(36).substring(2, 15);
    const isChapter1 = Boolean(isCampaignTarget && activeChapter && activeChapter.id === 'chapter-1');
    const secret = configuredCode || (isChapter1 ? '489' : generateCode(digits, allowDuplicates));

    // --- DETERMINE EQUIPPED RAILS ---
    const effectiveEquippedRails: Partial<Record<HardwareRailSlot, RigHardwareId | null>> = {
      memory_1: mockWallet.equippedRails?.memory_1 || null,
      memory_2: mockWallet.equippedRails?.memory_2 || null,
      coprocessor: mockWallet.equippedRails?.coprocessor || null,
      bus_interconnect: mockWallet.equippedRails?.bus_interconnect || null,
    };

    // Also sync installed hardware from mockRigHardware (supporting direct test mutations)
    for (const [id, item] of Object.entries(mockRigHardware)) {
      if (item.installed && !item.burned) {
        const norm = normalizeHardwareId(id);
        const slot = item.railSlot || (item.slot === 'memory-1' ? 'memory_1' : item.slot === 'memory-2' ? 'memory_2' : item.slot === 'coprocessor' ? 'coprocessor' : null);
        if (norm && slot) {
          effectiveEquippedRails[slot] = norm;
        }
      }
    }

    // Ensure any burned item does not provide bonuses
    const aliasMap: Record<string, string> = {
      'rig-memory-buffer-1': 'memory_buffer_mk1',
      'memory_buffer_mk1': 'rig-memory-buffer-1',
      'rig-memory-buffer-2': 'memory_buffer_mk2',
      'memory_buffer_mk2': 'rig-memory-buffer-2',
      'rig-heuristic-coprocessor': 'heuristic_coproc',
      'heuristic_coproc': 'rig-heuristic-coprocessor',
    };

    for (const [slot, modId] of Object.entries(effectiveEquippedRails) as [HardwareRailSlot, RigHardwareId | null][]) {
      if (modId) {
        const item1 = mockRigHardware[modId];
        const alias = aliasMap[modId];
        const item2 = alias ? mockRigHardware[alias] : undefined;
        if (item1?.burned || item2?.burned) {
          effectiveEquippedRails[slot] = null;
        }
      }
    }

    // --- APPLY STAT MODIFIERS VIA PURE FUNCTION ---
    const effectiveRig = computeEffectiveRigStats(
      {
        tier: node.tier,
        attempts: baseAttempts,
        timerSeconds: timerSeconds,
        bounty: node.bounty,
        failureFine: Math.floor(node.bounty / 2),
      },
      effectiveEquippedRails
    );

    // Heuristic Co-Processor pre-removes dead digits
    let eliminatedDigits: string[] = [];
    if (effectiveRig.autoDeadDigitsCount > 0) {
      const allDigits = '0123456789'.split('');
      const nonCodeDigits = allDigits.filter((d) => !secret.includes(d));
      const shuffled = nonCodeDigits.sort(() => Math.random() - 0.5);
      eliminatedDigits = shuffled.slice(0, effectiveRig.autoDeadDigitsCount);
    }

    // Parity Scanner ASIC calculates secret distribution
    const parity = effectiveRig.revealParityDistribution
      ? calculateParityDistribution(secret)
      : null;

    const sessionNode = {
      ...node,
      digits,
      allowDuplicates,
      attempts: effectiveRig.maxAttempts,
      timerSeconds: effectiveRig.timerSeconds,
      bounty: effectiveRig.effectiveBounty,
    };

    const iceTypes = ['Liar', 'Drift', 'Pot-only', 'Ghost', 'Sticky', 'None'] as const;
    const configuredIce = defense?.ice && defense.ice !== 'None' ? defense.ice : undefined;
    const activeIce = configuredIce || iceTypeFromCampaign || (node.tier >= 3 ? iceTypes[Math.floor(Math.random() * 5)] : 'None');

    const session = {
      id: sessionId,
      nodeId: node.id,
      secret,
      attemptsLeft: effectiveRig.maxAttempts,
      startedAt: Date.now(),
      status: 'active' as const,
      node: sessionNode,
      eliminatedDigits,
      ice: activeIce,
      courtesy: Boolean(courtesy),
      courtesyUsed: false,
      effectiveRig,
      parityDistribution: parity,
      turnCount: 0,
      lastTurnTime: Date.now(),
      fastTurnRefundUsed: false,
    };

    mockSessions.set(sessionId, session as any);

    return NextResponse.json({
      sessionId,
      config: {
        length: digits,
        digits,
        allowDuplicates,
        attempts: effectiveRig.maxAttempts,
        maxAttempts: effectiveRig.maxAttempts,
        timerSeconds: effectiveRig.timerSeconds,
        tier: node.tier,
        ice: activeIce,
        eliminatedDigits,
        nodeName: node.name,
        nodeType: node.type,
        bounty: effectiveRig.effectiveBounty,
        district: node.district,
        parityDistribution: parity,
      },
      startedAt: session.startedAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
