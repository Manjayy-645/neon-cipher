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
});
