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
        const fine = isCourtesy ? 0 : Math.floor(session.node.bounty / 2);
        if (fine > 0) {
          recordTransaction(`Trace Fine: ${session.node.name} (Timeout)`, -fine, 'credits', 'fine');

          const defense = getNodeDefense(session.nodeId);
          if (defense && defense.ownerHandle && defense.ownerHandle !== activeAccountId) {
            creditDefenseFine(defense.ownerHandle, fine, session.nodeId);
          }
        }

        let burnedHardwareName: string | undefined;
        if (session.node.tier === 5) {
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

    session.attemptsLeft--;
    const ice = session.ice || 'None';
    const rawScore = calculateScore(session.secret, guess);
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
      });
    }

    // Check if defensive firewall shield is active
    const isShieldActive = Boolean((session as any).iceShield);
    if (isShieldActive) {
      (session as any).iceShield = false; // consumed by defensive action
    }

    // Liar ICE: 35% chance to falsify feedback (blocked if shield active)
    const isLiarFalsified = !isShieldActive && ice === 'Liar' && Math.random() < 0.35;
    const effectiveIce = isShieldActive ? 'None' : ice;
    const iceScore = calculateScoreWithIce(session.secret, guess, effectiveIce, {
      isFalsified: isLiarFalsified,
    });

    // Drift ICE: Mutate 1 digit of the secret after an unsuccessful attempt if game continues
    if (!isShieldActive && ice === 'Drift' && session.attemptsLeft > 0) {
      session.secret = driftSecret(session.secret, session.node.allowDuplicates);
    }

    if (session.attemptsLeft <= 0) {
      session.status = 'lost';
      const isCourtesy = Boolean((session as any).courtesy && !(session as any).courtesyUsed);
      if (isCourtesy) {
        (session as any).courtesyUsed = true;
      }
      const fine = isCourtesy ? 0 : Math.floor(session.node.bounty / 2);
      if (fine > 0) {
        recordTransaction(`Trace Fine: ${session.node.name} (Attempts)`, -fine, 'credits', 'fine');

        const defense = getNodeDefense(session.nodeId);
        if (defense && defense.ownerHandle && defense.ownerHandle !== activeAccountId) {
          creditDefenseFine(defense.ownerHandle, fine, session.nodeId);
        }
      }

      let burnedHardwareName: string | undefined;
      if (session.node.tier === 5) {
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
      });
    }

    return NextResponse.json({
      pots: iceScore.pots,
      pans: iceScore.pans,
      totalHits: iceScore.totalHits,
      ice,
      attemptsLeft: session.attemptsLeft,
      status: 'active',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
