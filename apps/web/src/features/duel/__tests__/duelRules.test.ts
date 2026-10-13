import { describe, it, expect } from 'vitest';
import {
  calculateDuelPot,
  calculateDoubleOrNothing,
  isExploitAllowed,
  SABOTAGE_RULES,
  generateNullByteGuess,
} from '@neon-cipher/game-rules/src/index';

describe('Duel Game Rules Scoring & Pot (packages/game-rules)', () => {
  describe('Pot & Rake Calculations', () => {
    it('calculates total pot, 10% rake, and net payout correctly for 500 wager', () => {
      const pot = calculateDuelPot(500, 0.10);
      expect(pot.playerWager).toBe(500);
      expect(pot.totalPot).toBe(1000);
      expect(pot.rake).toBe(100);
      expect(pot.netPot).toBe(900);
    });

    it('handles zero wager casual matches without negative numbers', () => {
      const pot = calculateDuelPot(0, 0.10);
      expect(pot.totalPot).toBe(0);
      expect(pot.rake).toBe(0);
      expect(pot.netPot).toBe(0);
    });

    it('calculates Double or Nothing with 2x multiplier and rake deduction', () => {
      const don = calculateDoubleOrNothing(900, 0.10);
      expect(don.totalPot).toBe(1800);
      expect(don.rake).toBe(180);
      expect(don.netPot).toBe(1620);
    });
  });

  describe('Exploit Restrictions in Ranked vs Casual', () => {
    it('permits exploits in casual matches', () => {
      const result = isExploitAllowed('casual');
      expect(result.allowed).toBe(true);
    });

    it('strictly forbids exploits in High-stakes wager matches', () => {
      const result = isExploitAllowed('wager');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('disabled in ranked');
    });

    it('strictly forbids exploits in Turf war matches', () => {
      const result = isExploitAllowed('turf');
      expect(result.allowed).toBe(false);
    });
  });

  describe('Sabotage Rules & Costs', () => {
    it('defines Static Injector at 300 credits with scramble_keypad effect', () => {
      const rule = SABOTAGE_RULES['tool-static-injector'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(300);
      expect(rule.effectType).toBe('scramble_keypad');
    });

    it('defines Blackout Ping at 550 credits with 6 second static effect', () => {
      const rule = SABOTAGE_RULES['tool-blackout-ping'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(550);
      expect(rule.durationSeconds).toBe(6);
      expect(rule.effectType).toBe('static_history');
    });

    it('defines Trace Accelerator at 800 credits with drain_clock effect', () => {
      const rule = SABOTAGE_RULES['tool-trace-accelerator'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(800);
      expect(rule.effectType).toBe('drain_clock');
    });

    it('defines Firewall Patch at 450 credits with firewall_shield effect', () => {
      const rule = SABOTAGE_RULES['tool-firewall-patch'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(450);
      expect(rule.effectType).toBe('firewall_shield');
    });
  });

  describe('Null_Byte AI Opponent Simulation', () => {
    it('generates valid digits of the exact specified length', () => {
      const guess = generateNullByteGuess(4, [], '4567');
      expect(guess).toHaveLength(4);
      expect(/^\d+$/.test(guess)).toBe(true);
    });

    it('avoids repeating identical guesses already submitted', () => {
      const guess = generateNullByteGuess(4, ['1234', '5678'], '9012');
      expect(guess).not.toBe('1234');
      expect(guess).not.toBe('5678');
    });
  });
});
