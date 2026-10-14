import { describe, it, expect } from 'vitest';
import {
  COOP_STAGE_TEMPLATES,
  calculateCoopReward,
  findDeadDigitsForAlpha,
  validateCoopGuess,
  calculateCoopPayout,
  CoopStageConfig,
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
  });

  describe('Dead Digit Elimination Helper', () => {
    it('returns digits that are not present in Alpha secret and not yet eliminated', () => {
      const alphaSecret = '7294';
      const alreadyEliminated = ['0', '1'];
      const candidates = findDeadDigitsForAlpha(alphaSecret, alreadyEliminated);

      // Digits in secret: 7, 2, 9, 4
      // Digits eliminated: 0, 1
      // Dead candidates remaining should be from: 3, 5, 6, 8
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
      expect(validateCoopGuess('alpha', '1123')).toBe(false); // Duplicates rejected
      expect(validateCoopGuess('alpha', 'abcd')).toBe(false);
    });

    it('validates Beta guesses strictly to 3 unique digits', () => {
      expect(validateCoopGuess('beta', '381')).toBe(true);
      expect(validateCoopGuess('beta', '38')).toBe(false);
      expect(validateCoopGuess('beta', '3812')).toBe(false);
      expect(validateCoopGuess('beta', '331')).toBe(false); // Duplicates rejected
      expect(validateCoopGuess('beta', 'abc')).toBe(false);
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
});
