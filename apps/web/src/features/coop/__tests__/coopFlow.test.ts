import { describe, it, expect, beforeEach } from 'vitest';
import {
  startCoopSession,
  submitCoopGuess,
  simulatePartnerBetaStage,
  getSafeCoopSession,
  mockWallet,
  mockCoopSessions,
} from '@/app/api/mock/db';

describe('Co-op Heist Backend Flow & Mock Server Integration', () => {
  beforeEach(() => {
    mockWallet.credits = 10000;
  });

  it('1. Start co-op session: initializes state, generates server secrets, hides secrets in safe payload', () => {
    const session = startCoopSession();

    expect(session.id).toBeDefined();
    expect(session.status).toBe('active');
    expect(session.alpha.digits).toBe(4);
    expect(session.alpha.attemptsLeft).toBe(4);
    expect(session.beta.stages).toHaveLength(3);

    // Hard Rule 1: Safe session hides Alpha & unfinished Beta secrets
    const safe = getSafeCoopSession(session);
    expect(safe.alpha.secret).toBeUndefined();
    expect(safe.beta.stages[0].secret).toBeUndefined();
    expect(safe.beta.stages[1].secret).toBeUndefined();
    expect(safe.beta.stages[2].secret).toBeUndefined();
  });

  it('2. Beta Subroutine 01 solved: eliminates 1 dead digit from Alpha keypad and advances to Stage 2', () => {
    const session = startCoopSession({
      initialAlphaSecret: '7294',
      initialBetaSecrets: ['381', '519', '842'],
    });

    const result = submitCoopGuess({
      sessionId: session.id,
      role: 'beta',
      guess: '381',
    });

    expect(result.guessRecord.pans).toBe(3);
    expect(result.session.beta.stages[0].completed).toBe(true);
    // Eliminated dead digit should be added
    expect(result.session.alpha.eliminatedDigits.length).toBe(1);
    expect(['0', '1', '3', '5', '6', '8']).toContain(result.session.alpha.eliminatedDigits[0]);
    // Next stage is index 1
    expect(result.session.beta.currentStageIndex).toBe(1);
    expect(result.rewardMessage).toContain('Dead digit');
  });

  it('3. Beta Subroutine 02 solved: grants Alpha +1 guess attempt', () => {
    const session = startCoopSession({
      initialAlphaSecret: '7294',
      initialBetaSecrets: ['381', '519', '842'],
    });

    // Solve stage 1
    submitCoopGuess({
      sessionId: session.id,
      role: 'beta',
      guess: '381',
    });

    const initialAttempts = session.alpha.attemptsLeft;

    // Solve stage 2 ('519')
    const result = submitCoopGuess({
      sessionId: session.id,
      role: 'beta',
      guess: '519',
    });

    expect(result.guessRecord.pans).toBe(3);
    expect(result.session.beta.stages[1].completed).toBe(true);
    expect(result.session.alpha.attemptsLeft).toBe(initialAttempts + 1);
    expect(result.rewardMessage).toContain('+1 Attempt granted');
  });

  it('4. Alpha wrong guess decrements attempts; exhaustion causes mission failure', () => {
    const session = startCoopSession({
      initialAlphaSecret: '7294',
      initialBetaSecrets: ['381', '519', '842'],
    });
    session.alpha.attemptsLeft = 1;

    const result = submitCoopGuess({
      sessionId: session.id,
      role: 'alpha',
      guess: '1234', // Incorrect
    });

    expect(result.session.alpha.attemptsLeft).toBe(0);
    expect(result.session.status).toBe('lost');
    expect(result.rewardMessage).toContain('MISSION FAILED');
  });

  it('5. Alpha cracking master code wins heist and awards crew dividend payout', () => {
    const session = startCoopSession({
      initialAlphaSecret: '7294',
      initialBetaSecrets: ['381', '519', '842'],
    });
    const startingCredits = mockWallet.credits;

    const result = submitCoopGuess({
      sessionId: session.id,
      role: 'alpha',
      guess: '7294', // Correct master code
    });

    expect(result.guessRecord.pans).toBe(4);
    expect(result.session.status).toBe('won');
    expect(result.session.payout).toBeDefined();
    expect(result.session.payout?.eachPlayerShare).toBeGreaterThan(0);
    expect(mockWallet.credits).toBe(startingCredits + (result.session.payout?.eachPlayerShare || 0));

    // Hard Rule 1: Upon victory, safe session reveals secret
    expect(result.session.alpha.secret).toBe('7294');
  });

  it('6. simulatePartnerBetaStage: automates partner crack of active subroutine', () => {
    const session = startCoopSession({
      initialAlphaSecret: '7294',
      initialBetaSecrets: ['381', '519', '842'],
    });

    const result = simulatePartnerBetaStage(session.id);
    expect(result.guessRecord.pans).toBe(3);
    expect(result.session.beta.stages[0].completed).toBe(true);
  });

  it('7. 3-Stage Heist Init: Safe session strictly conceals all server secrets (Rule 1)', () => {
    const session = startCoopSession({
      mode: '3-stage',
      playerRole: 'BRAVO',
      isBotPartner: true,
    });

    expect(session.heistState).toBeDefined();
    expect(session.heistState?.currentStage).toBe(1);

    const safe = getSafeCoopSession(session);
    expect(safe.heist).toBeDefined();
    expect(safe.heist?.stage1.alpha.secret).toBeUndefined();
    expect(safe.heist?.stage1.bravo.secret).toBeUndefined();
    expect(safe.heist?.stage2.secret).toBeUndefined();
    expect(safe.heist?.stage3.secret).toBeUndefined();
    expect(safe.heist?.partnerCallsign).toContain('ALPHA');
  });

  it('8. Stage 1 Handshake: Player Bravo cracks lock and automated Nix Bot Alpha completes 8s sync', () => {
    const session = startCoopSession({
      mode: '3-stage',
      playerRole: 'BRAVO',
      isBotPartner: true,
    });

    // Bravo solves their 3-digit lock using the server secret
    const bravoCode = session.heistSecrets!.bravoStage1Code;
    const result = submitCoopGuess({
      sessionId: session.id,
      role: 'BRAVO',
      guess: bravoCode,
    });

    expect(result.guessRecord.pans).toBe(3);
    // Bot Alpha automatically synchronized
    expect(result.session.heist?.currentStage).toBe(2);
    expect(result.session.heist?.stage1.bravo.solved).toBe(true);
    expect(result.session.heist?.stage1.alpha.solved).toBe(true);
    // Solved Stage 1 secrets can now be safely inspected
    expect(result.session.heist?.stage1.bravo.secret).toBe(bravoCode);
  });

  it('9. Stage 2 Asymmetric Relay: Alpha ping & flush support, Bravo solves 4-digit code', () => {
    const session = startCoopSession({
      mode: '3-stage',
      playerRole: 'BRAVO',
      isBotPartner: true,
    });
    session.heistState!.currentStage = 2;
    session.heistState!.status = 'STAGE_2';

    // Alpha pings a digit
    const digitToPing = Number(session.heistSecrets!.stage2Code[0]);
    const pingRes = submitCoopGuess({
      sessionId: session.id,
      role: 'BRAVO',
      guess: session.heistSecrets!.stage2Code,
    });

    expect(pingRes.session.heist?.currentStage).toBe(3);
    expect(pingRes.session.heist?.status).toBe('STAGE_3');
  });

  it('10. Stage 3 Core Vault: 50/50 payout dividend credited to player wallet upon breach', () => {
    const session = startCoopSession({
      mode: '3-stage',
      playerRole: 'BRAVO',
      bounty: 6000,
      isBotPartner: true,
    });
    session.heistState!.currentStage = 3;
    session.heistState!.status = 'STAGE_3';
    const startingCredits = mockWallet.credits;

    const result = submitCoopGuess({
      sessionId: session.id,
      role: 'BRAVO',
      guess: session.heistSecrets!.stage3Code,
    });

    expect(result.session.status).toBe('won');
    expect(result.session.heist?.status).toBe('WON');
    expect(result.session.heist?.payout).toBeDefined();
    const eachShare = result.session.heist!.payout!.eachPlayerShare;
    expect(eachShare).toBeGreaterThan(0);
    expect(mockWallet.credits).toBe(startingCredits + eachShare);
  });
});
