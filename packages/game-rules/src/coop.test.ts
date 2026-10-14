import { describe, it, expect } from 'vitest';
import {
  COOP_STAGE_TEMPLATES,
  calculateCoopReward,
  findDeadDigitsForAlpha,
  validateCoopGuess,
  calculateCoopPayout,
  CoopStageConfig,
  createCoopHeistState,
  submitStage1Guess,
  checkStage1SyncTimeout,
  pingDigitStage2,
  flushIceStage2,
  submitStage2Guess,
  submitStage3Guess,
  triggerOverdriveStage3,
  getNixRoleBriefing,
  getNixCoopCallout,
  HEIST_STAGES,
  DUAL_KEY_SYNC_WINDOW_MS,
  OVERDRIVE_FREEZE_MS,
} from './coop';

describe('Co-op Heist Rules (packages/game-rules)', () => {
  describe('Stage Templates & Configurations', () => {
    it('provides standard 3 auxiliary subroutines for Beta support', () => {
      expect(COOP_STAGE_TEMPLATES).toHaveLength(3);
      expect(COOP_STAGE_TEMPLATES[0].digits).toBe(3);
      expect(COOP_STAGE_TEMPLATES[0].rewardType).toBe('remove_dead_digit');
      expect(COOP_STAGE_TEMPLATES[1].rewardType).toBe('extra_attempt');
      expect(COOP_STAGE_TEMPLATES[2].rewardType).toBe('extra_attempt');
    });

    it('all stage templates have descriptive names and rewards', () => {
      COOP_STAGE_TEMPLATES.forEach((stage) => {
        expect(stage.name).toBeTruthy();
        expect(stage.rewardDescription).toBeTruthy();
        expect(stage.digits).toBe(3);
      });
    });

    it('defines 3 distinct heist stages with titles and descriptions', () => {
      expect(HEIST_STAGES[1].digits).toBe(3);
      expect(HEIST_STAGES[2].digits).toBe(4);
      expect(HEIST_STAGES[3].digits).toBe(5);
      expect(HEIST_STAGES[1].ruleChangeNotice).toContain('SYNCHRONIZED DUAL LOCKS');
      expect(HEIST_STAGES[2].ruleChangeNotice).toContain('ASYMMETRIC RELAY');
      expect(HEIST_STAGES[3].ruleChangeNotice).toContain('MASTER VAULT');
    });
  });

  describe('Dead Digit Elimination Helper', () => {
    it('returns digits that are not present in Alpha secret and not yet eliminated', () => {
      const alphaSecret = '7294';
      const alreadyEliminated = ['0', '1'];
      const candidates = findDeadDigitsForAlpha(alphaSecret, alreadyEliminated);

      expect(candidates).toEqual(expect.arrayContaining(['3', '5', '6', '8']));
      expect(candidates).not.toContain('7');
      expect(candidates).not.toContain('2');
      expect(candidates).not.toContain('9');
      expect(candidates).not.toContain('4');
      expect(candidates).not.toContain('0');
      expect(candidates).not.toContain('1');
    });

    it('returns empty array when all non-secret digits are already eliminated', () => {
      const alphaSecret = '7294';
      const allDead = ['0', '1', '3', '5', '6', '8'];
      const candidates = findDeadDigitsForAlpha(alphaSecret, allDead);
      expect(candidates).toHaveLength(0);
    });
  });

  describe('Reward Application', () => {
    it('calculates extra attempt reward accurately', () => {
      const stage: CoopStageConfig = {
        id: 2,
        name: 'Buffer Overflow',
        digits: 3,
        rewardType: 'extra_attempt',
        rewardDescription: 'Grants +1 attempt',
      };

      const result = calculateCoopReward(stage, {
        alphaAttempts: 4,
        alphaSecret: '7294',
        eliminatedDigits: [],
        remainingSeconds: 120,
      });

      expect(result.type).toBe('extra_attempt');
      expect(result.nextAttempts).toBe(5);
    });

    it('calculates remove dead digit reward accurately', () => {
      const stage: CoopStageConfig = {
        id: 1,
        name: 'Firewall Bypass',
        digits: 3,
        rewardType: 'remove_dead_digit',
        rewardDescription: 'Eliminates 1 dead digit',
      };

      const result = calculateCoopReward(stage, {
        alphaAttempts: 4,
        alphaSecret: '7294',
        eliminatedDigits: ['0'],
        remainingSeconds: 120,
      });

      expect(result.type).toBe('remove_dead_digit');
      expect(result.eliminatedDigit).toBeDefined();
      expect(['1', '3', '5', '6', '8']).toContain(result.eliminatedDigit);
      expect(result.eliminatedDigits).toContain(result.eliminatedDigit);
    });

    it('calculates time freeze reward accurately', () => {
      const stage: CoopStageConfig = {
        id: 4,
        name: 'Cryo-Cycle',
        digits: 3,
        rewardType: 'time_freeze',
        rewardDescription: 'Adds 30s to countdown',
      };

      const result = calculateCoopReward(stage, {
        alphaAttempts: 4,
        alphaSecret: '7294',
        eliminatedDigits: [],
        remainingSeconds: 60,
      });

      expect(result.type).toBe('time_freeze');
      expect(result.addedSeconds).toBe(30);
      expect(result.nextRemainingSeconds).toBe(90);
    });
  });

  describe('Guess Validation', () => {
    it('validates Alpha guesses strictly to 4 unique digits', () => {
      expect(validateCoopGuess('alpha', '1234')).toBe(true);
      expect(validateCoopGuess('alpha', '123')).toBe(false);
      expect(validateCoopGuess('alpha', '12345')).toBe(false);
      expect(validateCoopGuess('alpha', '1123')).toBe(false);
      expect(validateCoopGuess('alpha', 'abcd')).toBe(false);
    });

    it('validates Beta guesses strictly to 3 unique digits', () => {
      expect(validateCoopGuess('beta', '381')).toBe(true);
      expect(validateCoopGuess('beta', '38')).toBe(false);
      expect(validateCoopGuess('beta', '3812')).toBe(false);
      expect(validateCoopGuess('beta', '331')).toBe(false);
      expect(validateCoopGuess('beta', 'abc')).toBe(false);
    });
  });

  describe('Stage 1: Perimeter Handshake & 8s Dual-Key Sync Window', () => {
    it('starts 8-second sync window when Alpha cracks first', () => {
      const { state, secrets } = createCoopHeistState({
        initialSecrets: {
          alphaStage1Code: '123',
          bravoStage1Code: '456',
        },
      });

      expect(state.currentStage).toBe(1);
      expect(state.status).toBe('STAGE_1');
      expect(state.stage1.syncWindowMsRemaining).toBeNull();

      // Alpha submits non-winning guess
      const r1 = submitStage1Guess(state, secrets, 'ALPHA', '198');
      expect(r1.result.pans).toBe(1);
      expect(r1.result.pots).toBe(0);
      expect(state.stage1.alpha.solved).toBe(false);
      expect(state.stage1.syncWindowMsRemaining).toBeNull();

      // Alpha cracks lock
      const r2 = submitStage1Guess(state, secrets, 'ALPHA', '123');
      expect(r2.result.pans).toBe(3);
      expect(state.stage1.alpha.solved).toBe(true);
      expect(state.stage1.firstCrackedBy).toBe('ALPHA');
      expect(state.stage1.syncWindowMsRemaining).toBe(DUAL_KEY_SYNC_WINDOW_MS);
      expect(r2.event?.type).toBe('STAGE1_PARTNER_WAITING');
      expect(r2.event?.targetRole).toBe('BRAVO');

      // Bravo cracks within 8-second window -> advances to Stage 2
      const r3 = submitStage1Guess(state, secrets, 'BRAVO', '456');
      expect(r3.result.pans).toBe(3);
      expect(state.stage1.bravo.solved).toBe(true);
      expect(state.currentStage).toBe(2);
      expect(state.status).toBe('STAGE_2');
      expect(r3.event?.type).toBe('STAGE1_SOLVED');
    });

    it('resets perimeter locks if sync window expires before partner cracks', () => {
      const { state, secrets } = createCoopHeistState({
        initialSecrets: {
          alphaStage1Code: '321',
          bravoStage1Code: '654',
        },
      });

      // Bravo cracks first
      submitStage1Guess(state, secrets, 'BRAVO', '654');
      expect(state.stage1.bravo.solved).toBe(true);
      expect(state.stage1.syncWindowMsRemaining).toBe(8000);

      // 4 seconds pass (no timeout)
      const t1 = checkStage1SyncTimeout(state, secrets, 4000);
      expect(t1.reset).toBe(false);
      expect(state.stage1.syncWindowMsRemaining).toBe(4000);

      // Remaining 4.5 seconds pass -> timeout!
      const oldAlphaCode = secrets.alphaStage1Code;
      const oldBravoCode = secrets.bravoStage1Code;
      const t2 = checkStage1SyncTimeout(state, secrets, 4500);

      expect(t2.reset).toBe(true);
      expect(t2.event?.type).toBe('STAGE1_SYNC_EXPIRED');
      expect(state.stage1.resetsCount).toBe(1);
      expect(state.stage1.syncWindowMsRemaining).toBeNull();
      expect(state.stage1.firstCrackedBy).toBeNull();
      expect(state.stage1.alpha.solved).toBe(false);
      expect(state.stage1.bravo.solved).toBe(false);
      // Fresh 3-digit unique codes rolled
      expect(secrets.alphaStage1Code).toHaveLength(3);
      expect(secrets.bravoStage1Code).toHaveLength(3);
      // Status remains STAGE_1 (costs time, does not abort immediately)
      expect(state.status).toBe('STAGE_1');
    });
  });

  describe('Stage 2: Airgap Tunneling (Asymmetric Relay)', () => {
    it('allows Alpha to ping digits and informs Bravo whether digit is present or dead', () => {
      const { state, secrets } = createCoopHeistState({
        initialSecrets: {
          stage2Code: '4920',
        },
      });
      state.currentStage = 2;
      state.status = 'STAGE_2';

      expect(state.stage2.reconChargesRemaining).toBe(3);

      // Ping digit 9 (present)
      const p1 = pingDigitStage2(state, secrets, 9);
      expect(p1.status).toBe('CONFIRMED_PRESENT');
      expect(state.stage2.pingedDigits[9]).toBe('CONFIRMED_PRESENT');
      expect(state.stage2.reconChargesRemaining).toBe(2);
      expect(p1.event.type).toBe('STAGE2_DIGIT_PINGED');
      expect(p1.event.targetRole).toBe('BRAVO');

      // Ping digit 7 (dead)
      const p2 = pingDigitStage2(state, secrets, 7);
      expect(p2.status).toBe('CONFIRMED_DEAD');
      expect(state.stage2.pingedDigits[7]).toBe('CONFIRMED_DEAD');
      expect(state.stage2.reconChargesRemaining).toBe(1);

      // Ping digit 4 (present)
      pingDigitStage2(state, secrets, 4);
      expect(state.stage2.reconChargesRemaining).toBe(0);

      // Further pings should throw
      expect(() => pingDigitStage2(state, secrets, 1)).toThrow('Recon Charges depleted');
    });

    it('allows Alpha to flush ICE, unmasking past clues and protecting next 2 guesses', () => {
      const { state, secrets } = createCoopHeistState({
        stage2Ice: 'Liar',
        initialSecrets: {
          stage2Code: '1853',
        },
      });
      state.currentStage = 2;
      state.status = 'STAGE_2';

      // Bravo submits guess under active Liar ICE (forcing falsification)
      const g1 = submitStage2Guess(state, secrets, '1859', { forceCorrupt: true });
      expect(g1.result.uncorruptedPans).toBe(3);
      expect(g1.result.uncorruptedPots).toBe(0);
      expect(g1.result.isFalsified).toBe(true);
      expect(g1.event?.type).toBe('STAGE2_ICE_DETECTED');

      // Alpha executes FLUSH ICE
      const f1 = flushIceStage2(state);
      expect(state.stage2.reconChargesRemaining).toBe(2);
      expect(state.stage2.iceFlushedGuessesRemaining).toBe(2);
      expect(f1.event.type).toBe('STAGE2_ICE_FLUSHED');

      // Past guess was uncorrupted
      expect(state.stage2.guesses[0].pans).toBe(3);
      expect(state.stage2.guesses[0].pots).toBe(0);
      expect(state.stage2.guesses[0].isFalsified).toBe(false);

      // Next guess uses flushed clean channel
      const g2 = submitStage2Guess(state, secrets, '1850');
      expect(g2.result.isFalsified).toBe(false);
      expect(g2.result.pans).toBe(3);
      expect(state.stage2.iceFlushedGuessesRemaining).toBe(1);

      // Bravo solves code -> advances to Stage 3
      const g3 = submitStage2Guess(state, secrets, '1853');
      expect(g3.result.pans).toBe(4);
      expect(state.stage2.solved).toBe(true);
      expect(state.currentStage).toBe(3);
      expect(state.status).toBe('STAGE_3');
      expect(g3.event?.type).toBe('STAGE2_SOLVED');
    });
  });

  describe('Stage 3: The Core Vault & Overdrive', () => {
    it('manages 5-digit master lock with alternating turns and attempts decrement', () => {
      const { state, secrets } = createCoopHeistState({
        initialSecrets: {
          stage3Code: '74192',
        },
      });
      state.currentStage = 3;
      state.status = 'STAGE_3';

      expect(state.stage3.attemptsRemaining).toBe(8);
      expect(state.stage3.activeTurn).toBe('BRAVO');

      // Bravo's turn
      const r1 = submitStage3Guess(state, secrets, 'BRAVO', '74190');
      expect(r1.result.pans).toBe(4);
      expect(state.stage3.attemptsRemaining).toBe(7);
      expect(state.stage3.activeTurn).toBe('ALPHA');

      // Alpha's turn
      const r2 = submitStage3Guess(state, secrets, 'ALPHA', '74192');
      expect(r2.result.pans).toBe(5);
      expect(state.stage3.solved).toBe(true);
      expect(state.status).toBe('WON');
      expect(state.payout).toBeDefined();
      expect(state.payout?.eachPlayerShare).toBeGreaterThan(0);
      expect(r2.event?.type).toBe('HEIST_WON');
    });

    it('allows Bravo to pop Overdrive once to freeze clock for 10 seconds', () => {
      const { state } = createCoopHeistState();
      state.currentStage = 3;
      state.status = 'STAGE_3';
      const initialClock = state.sharedClockMsRemaining;

      const od = triggerOverdriveStage3(state);
      expect(od.event.type).toBe('STAGE3_OVERDRIVE_ACTIVATED');
      expect(state.stage3.overdriveUsed).toBe(true);
      expect(state.sharedClockMsRemaining).toBe(initialClock + OVERDRIVE_FREEZE_MS);

      // Triggering again should throw
      expect(() => triggerOverdriveStage3(state)).toThrow('already been used');
    });

    it('sets status to LOST when attempts run out', () => {
      const { state, secrets } = createCoopHeistState({
        initialSecrets: { stage3Code: '98765' },
      });
      state.currentStage = 3;
      state.status = 'STAGE_3';
      state.stage3.attemptsRemaining = 1;

      const r = submitStage3Guess(state, secrets, 'BRAVO', '12340');
      expect(state.stage3.attemptsRemaining).toBe(0);
      expect(state.status).toBe('LOST');
      expect(r.event?.type).toBe('HEIST_LOST');
    });
  });

  describe('Bounty and Dividend Payout Calculation', () => {
    it('calculates base payout with speed bonus for rapid clear', () => {
      const payout = calculateCoopPayout({
        baseBounty: 2000,
        remainingSeconds: 100,
        totalSeconds: 180,
        stagesCompleted: 3,
      });

      expect(payout.baseBounty).toBe(2000);
      expect(payout.speedBonus).toBeGreaterThan(0);
      expect(payout.totalPayout).toBe(payout.baseBounty + payout.speedBonus + payout.supportBonus);
      expect(payout.eachPlayerShare).toBe(Math.floor(payout.totalPayout / 2));
    });

    it('calculates 50/50 split and 10% Street Cred bonus for Stage 3 completion', () => {
      const payout = calculateCoopPayout(5000, 60000, 4, 120000);

      expect(payout.baseBounty).toBe(5000);
      expect(payout.speedBonus).toBe(Math.floor(5000 * 0.25 * 0.5)); // 625
      expect(payout.efficiencyBonus).toBe(4 * 100); // 400
      expect(payout.totalPayout).toBe(5000 + 625 + 400); // 6025
      expect(payout.eachPlayerShare).toBe(Math.floor(6025 / 2)); // 3012
      expect(payout.streetCredBonus).toBe(Math.floor(6025 * 0.1)); // 602
    });

    it('awards no speed bonus if clear is down to the wire', () => {
      const payout = calculateCoopPayout({
        baseBounty: 2000,
        remainingSeconds: 0,
        totalSeconds: 180,
        stagesCompleted: 0,
      });

      expect(payout.speedBonus).toBe(0);
      expect(payout.supportBonus).toBe(0);
      expect(payout.totalPayout).toBe(2000);
      expect(payout.eachPlayerShare).toBe(1000);
    });
  });

  describe('Nix Role-Specific Guidance & Callouts', () => {
    it('provides distinct, plain-language briefings for Alpha and Bravo', () => {
      const alphaBrief = getNixRoleBriefing('ALPHA');
      expect(alphaBrief.roleName).toContain('ALPHA');
      expect(alphaBrief.briefing).toContain('PING DIGIT');
      expect(alphaBrief.briefing).toContain('FLUSH ICE');

      const bravoBrief = getNixRoleBriefing('BRAVO');
      expect(bravoBrief.roleName).toContain('BRAVO');
      expect(bravoBrief.briefing).toContain('keypad');
      expect(bravoBrief.briefing).toContain('OVERDRIVE');
    });

    it('returns STAGE1_PARTNER_WAITING callout tailored to recipient role', () => {
      const calloutForWaitingPlayer = getNixCoopCallout(
        {
          type: 'STAGE1_PARTNER_WAITING',
          stage: 1,
          actorRole: 'ALPHA',
          targetRole: 'BRAVO',
          syncWindowMsRemaining: 8000,
        },
        'BRAVO'
      );
      expect(calloutForWaitingPlayer?.mood).toBe('urgent');
      expect(calloutForWaitingPlayer?.dialogue).toContain('8 seconds');

      const calloutForFirstPlayer = getNixCoopCallout(
        {
          type: 'STAGE1_PARTNER_WAITING',
          stage: 1,
          actorRole: 'ALPHA',
          targetRole: 'BRAVO',
          syncWindowMsRemaining: 8000,
        },
        'ALPHA'
      );
      expect(calloutForFirstPlayer?.mood).toBe('encouraging');
      expect(calloutForFirstPlayer?.dialogue).toContain('Holding the dual-key handshake');
    });

    it('returns STAGE1_SYNC_EXPIRED callout', () => {
      const callout = getNixCoopCallout(
        { type: 'STAGE1_SYNC_EXPIRED', stage: 1 },
        'ALPHA'
      );
      expect(callout?.mood).toBe('warning');
      expect(callout?.dialogue).toContain('Missed the sync window');
    });

    it('returns STAGE2_ICE_DETECTED callout alerting Alpha to flush ICE', () => {
      const callout = getNixCoopCallout(
        { type: 'STAGE2_ICE_DETECTED', stage: 2, targetRole: 'ALPHA' },
        'ALPHA'
      );
      expect(callout?.mood).toBe('warning');
      expect(callout?.dialogue).toContain('Hit [FLUSH ICE]');
    });

    it('returns STAGE2_DIGIT_PINGED callout alerting Bravo to keypad hint', () => {
      const callout = getNixCoopCallout(
        { type: 'STAGE2_DIGIT_PINGED', stage: 2, digit: 7, targetRole: 'BRAVO' },
        'BRAVO'
      );
      expect(callout?.mood).toBe('encouraging');
      expect(callout?.dialogue).toContain('Alpha just scanned digit [7]');
    });

    it('returns STAGE3_LOW_CLOCK callout prompting Bravo to pop Overdrive', () => {
      const callout = getNixCoopCallout(
        { type: 'STAGE3_LOW_CLOCK', stage: 3 },
        'BRAVO'
      );
      expect(callout?.mood).toBe('urgent');
      expect(callout?.dialogue).toContain('Pop your [OVERDRIVE]');
    });

    it('returns HEIST_WON and HEIST_LOST terminal callouts', () => {
      const won = getNixCoopCallout({ type: 'HEIST_WON', stage: 3 }, 'ALPHA');
      expect(won?.dialogue).toContain('Master signal unlocked');

      const lost = getNixCoopCallout({ type: 'HEIST_LOST', stage: 3 }, 'ALPHA');
      expect(lost?.dialogue).toContain('Lockout protocol activated');
    });
  });
});

