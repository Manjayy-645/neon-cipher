import { NextResponse } from 'next/server';
import { mockSessions, mockWallet, recordTransaction } from '../../db';
import { applyTerminalTool, TERMINAL_TOOL_RULES } from '@neon-cipher/game-rules';

// MOCK: replace with Supabase edge function.
export async function POST(request: Request) {
  try {
    const { sessionId, toolId } = await request.json();

    if (!sessionId || !toolId) {
      return NextResponse.json(
        { error: 'Missing sessionId or toolId parameter.' },
        { status: 400 }
      );
    }

    const session = mockSessions.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is no longer active.' }, { status: 400 });
    }

    const rule = TERMINAL_TOOL_RULES[toolId];
    if (!rule) {
      return NextResponse.json({ error: `Unknown tool: ${toolId}` }, { status: 400 });
    }

    // Check inventory
    const owned = mockWallet.inventory[toolId] || 0;
    if (owned <= 0) {
      return NextResponse.json(
        { error: `Cannot activate ${rule.name}: None remaining in inventory.` },
        { status: 400 }
      );
    }

    // Deduct consumable tool
    mockWallet.inventory[toolId] = owned - 1;
    if (mockWallet.inventory[toolId] <= 0) {
      delete mockWallet.inventory[toolId];
      mockWallet.equippedTools = mockWallet.equippedTools.filter((id) => id !== toolId);
    }

    recordTransaction(`Intrusion Tool: ${rule.name}`, 0, 'credits', 'purchase');

    // Apply rule logic server-side with access to secret
    const toolResult = applyTerminalTool({
      toolId,
      secret: session.secret,
      eliminatedDigits: session.eliminatedDigits || [],
      timerSeconds: session.node.timerSeconds,
      attemptsLeft: session.attemptsLeft,
      tier: session.node.tier,
      history: (session as any).guesses || [],
      currentIce: session.ice,
      revealedSlots: (session as any).revealedSlots || [],
    });

    if (!toolResult.success) {
      return NextResponse.json({ error: toolResult.error || 'Failed to apply tool.' }, { status: 400 });
    }

    // Update server session state
    if (toolResult.eliminatedDigit) {
      session.eliminatedDigits = [...(session.eliminatedDigits || []), toolResult.eliminatedDigit];
    }

    if (toolResult.shieldArmed) {
      (session as any).iceShield = true;
    }

    if (toolResult.revealedSlot) {
      (session as any).revealedSlots = [
        ...((session as any).revealedSlots || []),
        toolResult.revealedSlot.slotIndex,
      ];
    }

    if (toolResult.timeAddedSeconds) {
      // Add time by pushing startedAt forward
      session.startedAt = (session.startedAt || Date.now()) + toolResult.timeAddedSeconds * 1000;
    }

    if (toolResult.extraAttempts) {
      session.attemptsLeft = (session.attemptsLeft || 0) + toolResult.extraAttempts;
    }

    if (toolResult.cleanseIce) {
      (session as any).cleanseTurnsLeft = toolResult.cleanseTurns || 2;
    }

    if (toolResult.autoCrack) {
      session.status = 'won';
      session.node.bounty = 0; // Skeleton key grants 0 bounty payout
    }

    return NextResponse.json({
      success: true,
      toolId,
      effectType: toolResult.effectType,
      eliminatedDigit: toolResult.eliminatedDigit,
      hasDuplicates: toolResult.hasDuplicates,
      shieldArmed: toolResult.shieldArmed,
      timeAddedSeconds: toolResult.timeAddedSeconds,
      timerFrozenSeconds: toolResult.timerFrozenSeconds,
      cleanseIce: toolResult.cleanseIce,
      cleanseTurns: toolResult.cleanseTurns,
      uncorruptedScore: toolResult.uncorruptedScore,
      extraAttempts: toolResult.extraAttempts,
      revealedSlot: toolResult.revealedSlot,
      autoCrack: toolResult.autoCrack,
      secret: toolResult.autoCrack ? session.secret : undefined,
      message: toolResult.message,
      inventory: mockWallet.inventory,
      equippedTools: mockWallet.equippedTools,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Tool activation failed.' },
      { status: 500 }
    );
  }
}
