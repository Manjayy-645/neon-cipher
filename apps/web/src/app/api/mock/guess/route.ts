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
import { validateGuess, calculateScore, getChapterById } from '@neon-cipher/game-rules/src/index';

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
      if (elapsed > session.node.timerSeconds) {
        session.status = 'lost';
        const fine = Math.floor(session.node.bounty / 2);
        recordTransaction(`Trace Fine: ${session.node.name} (Timeout)`, -fine, 'credits', 'fine');

        const defense = getNodeDefense(session.nodeId);
        if (defense && defense.ownerHandle && defense.ownerHandle !== activeAccountId) {
          creditDefenseFine(defense.ownerHandle, fine, session.nodeId);
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
    const score = calculateScore(session.secret, guess);

    if (score.pots === session.node.digits) {
      session.status = 'won';
      recordTransaction(`Breach: ${session.node.name}`, session.node.bounty, 'credits', 'payout');

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
        pots: score.pots,
        pans: score.pans,
        attemptsLeft: session.attemptsLeft,
        status: 'won',
        secret: session.secret,
        payout: session.node.bounty,
        campaign: campaignResult,
      });
    }

    if (session.attemptsLeft <= 0) {
      session.status = 'lost';
      const fine = Math.floor(session.node.bounty / 2);
      recordTransaction(`Trace Fine: ${session.node.name} (Attempts)`, -fine, 'credits', 'fine');

      const defense = getNodeDefense(session.nodeId);
      if (defense && defense.ownerHandle && defense.ownerHandle !== activeAccountId) {
        creditDefenseFine(defense.ownerHandle, fine, session.nodeId);
      }

      let burnedHardwareName: string | undefined;
      if (session.node.tier === 5) {
        const burned = burnInstalledHardware();
        if (burned) burnedHardwareName = burned.name;
      }

      return NextResponse.json({
        pots: score.pots,
        pans: score.pans,
        attemptsLeft: 0,
        status: 'lost',
        secret: session.secret,
        fine,
        burnedHardware: burnedHardwareName,
      });
    }

    return NextResponse.json({
      pots: score.pots,
      pans: score.pans,
      attemptsLeft: session.attemptsLeft,
      status: 'active',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
