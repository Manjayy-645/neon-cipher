import { describe, it, expect } from 'vitest';
import {
  possibleCodes,
  isCommonWeakCode,
  estimateCodeDifficulty,
  calculateNodeDecay,
  calculateNodeIncome,
  calculateDefenseFines,
} from './codemaker';

describe('Task 12: Codemaker & Defense Game Rules', () => {
  describe('possibleCodes', () => {
    it('calculates permutations for unique codes correctly', () => {
      // 3 digits: 10 * 9 * 8 = 720
      expect(possibleCodes(3, false)).toBe(720);
      // 4 digits: 10 * 9 * 8 * 7 = 5,040
      expect(possibleCodes(4, false)).toBe(5040);
      // 5 digits: 10 * 9 * 8 * 7 * 6 = 30,240
      expect(possibleCodes(5, false)).toBe(30240);
      // 6 digits: 151,200
      expect(possibleCodes(6, false)).toBe(151200);
    });

    it('calculates permutations with duplicates allowed correctly', () => {
      // 3 digits: 10^3 = 1,000
      expect(possibleCodes(3, true)).toBe(1000);
      // 4 digits: 10^4 = 10,000
      expect(possibleCodes(4, true)).toBe(10000);
      // 5 digits: 10^5 = 100,000
      expect(possibleCodes(5, true)).toBe(100000);
    });

    it('throws errors on invalid lengths', () => {
      expect(() => possibleCodes(0)).toThrow();
      expect(() => possibleCodes(11)).toThrow();
    });
  });

  describe('isCommonWeakCode', () => {
    it('warns about sequential runs like 1234 and 4321', () => {
      const resAsc = isCommonWeakCode('1234');
      expect(resAsc.isWeak).toBe(true);
      expect(resAsc.warning).toBeDefined();

      const resDesc = isCommonWeakCode('4321');
      expect(resDesc.isWeak).toBe(true);
      expect(resDesc.warning).toBeDefined();
    });

    it('warns about repeating digits like 0000 and 7777', () => {
      const res = isCommonWeakCode('0000');
      expect(res.isWeak).toBe(true);
      expect(res.warning).toContain('repeating');
    });

    it('warns about common PIN dictionary patterns like 2580 and 1212', () => {
      expect(isCommonWeakCode('2580').isWeak).toBe(true);
      expect(isCommonWeakCode('1212').isWeak).toBe(true);
    });

    it('approves complex unique patterns like 8319 or 5924', () => {
      const res = isCommonWeakCode('8319');
      expect(res.isWeak).toBe(false);
      expect(res.warning).toBeUndefined();
    });
  });

  describe('estimateCodeDifficulty', () => {
    it('penalizes weak codes with low score and warning', () => {
      const weakEst = estimateCodeDifficulty('1234', false);
      expect(weakEst.score).toBeLessThan(35);
      expect(weakEst.rating).toMatch(/WEAK/);
      expect(weakEst.warning).toBeDefined();
      expect(weakEst.poolSize).toBe(5040);
    });

    it('rates a strong non-repeating code higher and boosts with ICE modifiers', () => {
      const baseEst = estimateCodeDifficulty('7149', false);
      expect(baseEst.score).toBeGreaterThanOrEqual(45);
      expect(baseEst.warning).toBeUndefined();

      const icedEst = estimateCodeDifficulty('7149', false, ['Liar', 'Ghost']);
      expect(icedEst.score).toBeGreaterThan(baseEst.score);
      expect(icedEst.iceDefenseBonus).toBeGreaterThan(0);
      expect(icedEst.rating).toMatch(/STRONG|FORTIFIED/);
    });
  });

  describe('calculateNodeDecay', () => {
    it('decays unmaintained nodes over time', () => {
      const now = 1000000000000;
      const tenHoursAgo = now - 10 * 3600 * 1000;
      const decay = calculateNodeDecay(tenHoursAgo, now, 0);

      expect(decay.hoursElapsed).toBe(10);
      expect(decay.integrityPercent).toBeLessThan(100);
      expect(decay.decayRatePerHour).toBe(3.0);
    });

    it('funded budget significantly mitigates decay rate', () => {
      const now = 1000000000000;
      const tenHoursAgo = now - 10 * 3600 * 1000;
      const fundedDecay = calculateNodeDecay(tenHoursAgo, now, 500);

      expect(fundedDecay.decayRatePerHour).toBeLessThan(1.0);
      expect(fundedDecay.integrityPercent).toBeGreaterThan(95);
    });
  });

  describe('calculateNodeIncome', () => {
    it('accumulates hourly yield and respects income cap', () => {
      const now = 1000000000000;
      const fiveHoursAgo = now - 5 * 3600 * 1000;
      const income = calculateNodeIncome(100, fiveHoursAgo, now, 1000);

      expect(income.accumulatedYield).toBe(500);
      expect(income.isCapped).toBe(false);
      expect(income.percentFilled).toBe(50);

      const twentyHoursAgo = now - 20 * 3600 * 1000;
      const cappedIncome = calculateNodeIncome(100, twentyHoursAgo, now, 1000);
      expect(cappedIncome.accumulatedYield).toBe(1000);
      expect(cappedIncome.isCapped).toBe(true);
      expect(cappedIncome.percentFilled).toBe(100);
    });
  });

  describe('calculateDefenseFines', () => {
    it('calculates attacker fines for failed breaches', () => {
      expect(calculateDefenseFines(4, 2)).toBe(4 * 2 * 75);
    });
  });
});
