import { NextResponse } from 'next/server';
import {
  mockSessions,
  recordTransaction,
  burnInstalledHardware,
  mockCampaign,
  completeChapterAssignment,
  getNodeDefense,
  creditDefenseFine,
  transferNodeOwnership,
  activeAccountId,
} from '../db';
import { validateGuess, calculateScore, calculateScoreWithIce, driftSecret, getChapterById } from '@neon-cipher/game-rules/src/index';

// MOCK: replace with Supabase edge function.
export async function POST(request: Request) {
  try {
    const { sessionId, guess } = await request.json();
    if (!sessionId || !guess) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const session = mockSessions.get(sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // Check timer if applicable
    if (session.node.timerSeconds > 0) {
      const elapsed = (Date.now() - session.startedAt) / 1000;
      if (elapsed > session.node.timerSeconds || guess === 'timeout') {
        session.status = 'lost';
        const isCourtesy = Boolean((session as any).courtesy && !(session as any).courtesyUsed);
        if (isCourtesy) {
          (session as any).courtesyUsed = true;
        }
        const fineReduction = (session as any).effectiveRig?.fineReductionPercent || 0;
        const rawFine = isCourtesy ? 0 : Math.floor(session.node.bounty / 2);
        const fine = Math.round(rawFine * (1 - fineReduction / 100));

        if (fine > 0) {
          recordTransaction(`Trace Fine: ${session.node.name} (Timeout)`, -fine, 'credits', 'fine');

          const defense = getNodeDefense(session.nodeId);
          if (defense && defense.ownerHandle && defense.ownerHandle !== activeAccountId) {
            creditDefenseFine(defense.ownerHandle, fine, session.nodeId);
          }
        }

        let burnedHardwareName: string | undefined;
        if (
          session.node.tier === 5 &&
          !(session as any).effectiveRig?.preventTier5Burnout &&
          !(session as any).effectiveRig?.burnImmune
        ) {
          const burned = burnInstalledHardware();
          if (burned) burnedHardwareName = burned.name;
        }

        return NextResponse.json({
          status: 'lost',
          secret: session.secret,
          fine,
          error: 'Time expired',
          burnedHardware: burnedHardwareName,
        });
      }
    }

    const isValid = validateGuess(guess, session.node.digits, session.node.allowDuplicates);
    if (!isValid) return NextResponse.json({ error: 'Invalid guess format' }, { status: 400 });

    // Track turns & Neural Reflex Capacitor (4-second follow-up free turn)
    (session as any).turnCount = ((session as any).turnCount || 0) + 1;
    const now = Date.now();
    const timeSinceLastTurn = (now - ((session as any).lastTurnTime || session.startedAt)) / 1000;
    (session as any).lastTurnTime = now;

    let refundedAttempt = false;
    if (
      ((session as any).effectiveRig?.fastTurnRefundActive || (session as any).effectiveRig?.hasNeuralReflex) &&
      !(session as any).fastTurnRefundUsed &&
      (session as any).turnCount > 1 &&
      timeSinceLastTurn <= 4
    ) {
      (session as any).fastTurnRefundUsed = true;
      refundedAttempt = true;
      // Capacitor absorbs the attempt cost!
    } else {
      session.attemptsLeft--;
    }

    const ice = session.ice || 'None';
    const rawScore = calculateScore(session.secret, guess);

    // Record guess into server session history for tools (e.g. Cleanse Subroutine)
    if (!(session as any).guesses) {
      (session as any).guesses = [];
    }
    (session as any).guesses.push({
      guess,
      pots: rawScore.pots,
      pans: rawScore.pans,
    });

    // Syndicate Skimmer: $45 per Pan on Turn 1
    let firstTurnBonus = 0;
    const skimmerBonusRate = (session as any).effectiveRig?.firstTurnPanBonusCredits || ((session as any).effectiveRig?.hasSyndicateSkimmer ? 45 : 0);
    if (
      (session as any).turnCount === 1 &&
      skimmerBonusRate > 0 &&
      rawScore.pans > 0
    ) {
      firstTurnBonus = rawScore.pans * skimmerBonusRate;
      recordTransaction(`Syndicate Skimmer: ${session.node.name}`, firstTurnBonus, 'credits', 'payout');
    }

    const isWin = rawScore.pans === session.node.digits;

    if (isWin) {
      session.status = 'won';
      if (!session.recovery) {
        recordTransaction(`Breach: ${session.node.name}`, session.node.bounty, 'credits', 'payout');
      }

      const defense = getNodeDefense(session.nodeId);
      if (defense && defense.ownerHandle && defense.ownerHandle !== activeAccountId) {
        transferNodeOwnership(session.nodeId, activeAccountId);
      }

      let campaignResult = null;
      if (mockCampaign.activeChapterId) {
        const chapter = getChapterById(mockCampaign.activeChapterId);
        if (chapter && chapter.mapNodeId === session.nodeId) {
          campaignResult = completeChapterAssignment(chapter.id);
        }
      }

      return NextResponse.json({
        pots: rawScore.pots,
        pans: rawScore.pans,
        attemptsLeft: session.attemptsLeft,
        status: 'won',
        secret: session.secret,
        payout: session.node.bounty,
        campaign: campaignResult,
        ice,
        refundedAttempt,
        firstTurnBonus: firstTurnBonus > 0 ? firstTurnBonus : undefined,
      });
    }

    // Check if defensive firewall shield is active
    const isShieldActive = Boolean((session as any).iceShield);
    if (isShieldActive) {
      (session as any).iceShield = false; // consumed by defensive action
    }

    // Cleanse Subroutine: purges active ICE for 2 turns
    const isCleanseActive = ((session as any).cleanseTurnsLeft || 0) > 0;
    if (isCleanseActive) {
      (session as any).cleanseTurnsLeft -= 1;
    }

    // Liar ICE: 35% chance to falsify feedback (blocked if shield or cleanse active)
    const isLiarFalsified = !isShieldActive && !isCleanseActive && ice === 'Liar' && Math.random() < 0.35;
    const effectiveIce = isShieldActive || isCleanseActive ? 'None' : ice;
    const iceScore = calculateScoreWithIce(session.secret, guess, effectiveIce, {
      isFalsified: isLiarFalsified,
    });

    // Drift ICE: Mutate 1 digit of the secret after an unsuccessful attempt if game continues
    if (!isShieldActive && !isCleanseActive && ice === 'Drift' && session.attemptsLeft > 0) {
      session.secret = driftSecret(session.secret, session.node.allowDuplicates);
    }

    if (session.attemptsLeft <= 0) {
      session.status = 'lost';
      const isCourtesy = Boolean((session as any).courtesy && !(session as any).courtesyUsed);
      if (isCourtesy) {
        (session as any).courtesyUsed = true;
      }
      const fineReduction = (session as any).effectiveRig?.fineReductionPercent || 0;
      const rawFine = isCourtesy ? 0 : Math.floor(session.node.bounty / 2);
      const fine = Math.round(rawFine * (1 - fineReduction / 100));

      if (fine > 0) {
        recordTransaction(`Trace Fine: ${session.node.name} (Attempts)`, -fine, 'credits', 'fine');

        const defense = getNodeDefense(session.nodeId);
        if (defense && defense.ownerHandle && defense.ownerHandle !== activeAccountId) {
          creditDefenseFine(defense.ownerHandle, fine, session.nodeId);
        }
      }

      let burnedHardwareName: string | undefined;
      if (
        session.node.tier === 5 &&
        !(session as any).effectiveRig?.preventTier5Burnout &&
        !(session as any).effectiveRig?.burnImmune
      ) {
        const burned = burnInstalledHardware();
        if (burned) burnedHardwareName = burned.name;
      }

      return NextResponse.json({
        pots: iceScore.pots,
        pans: iceScore.pans,
        totalHits: iceScore.totalHits,
        ice,
        attemptsLeft: 0,
        status: 'lost',
        secret: session.secret,
        fine,
        burnedHardware: burnedHardwareName,
        refundedAttempt,
        firstTurnBonus: firstTurnBonus > 0 ? firstTurnBonus : undefined,
      });
    }

    return NextResponse.json({
      pots: iceScore.pots,
      pans: iceScore.pans,
      totalHits: iceScore.totalHits,
      ice,
      attemptsLeft: session.attemptsLeft,
      status: 'active',
      refundedAttempt,
      firstTurnBonus: firstTurnBonus > 0 ? firstTurnBonus : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
