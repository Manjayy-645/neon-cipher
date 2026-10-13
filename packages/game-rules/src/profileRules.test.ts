import { describe, it, expect } from 'vitest';
import {
  calculateWinRate,
  canUnlockSkill,
  getStandingLevel,
  checkMutualExclusion,
  getDailyBreachSeed,
  SkillNode,
  FactionStanding,
} from './profileRules';

describe('Task 13: Profile Rules & Calculations', () => {
  describe('calculateWinRate', () => {
    it('calculates win rate percentage properly', () => {
      expect(calculateWinRate(0, 0)).toBe(0);
      expect(calculateWinRate(5, 10)).toBe(50);
      expect(calculateWinRate(7, 9)).toBe(77.8);
      expect(calculateWinRate(15, 15)).toBe(100);
    });
  });

  describe('canUnlockSkill', () => {
    const mockSkill: SkillNode = {
      id: 'ghost-protocol',
      name: 'Ghost Protocol',
      branch: 'stealth',
      description: 'Slows security trace buildup.',
      tier: 2,
      pointCost: 2,
      prerequisites: ['pattern-rec'],
      unlocked: false,
      effectKey: 'TRACE_DILATION',
      effectSummary: '+25% time before trace initiates',
    };

    it('rejects if skill already unlocked', () => {
      const res = canUnlockSkill({ ...mockSkill, unlocked: true }, ['pattern-rec'], 5);
      expect(res.canUnlock).toBe(false);
      expect(res.reason).toContain('already unlocked');
    });

    it('rejects if available skill points are insufficient', () => {
      const res = canUnlockSkill(mockSkill, ['pattern-rec'], 1);
      expect(res.canUnlock).toBe(false);
      expect(res.reason).toContain('Requires 2 skill points');
    });

    it('rejects if prerequisites are missing', () => {
      const res = canUnlockSkill(mockSkill, [], 4);
      expect(res.canUnlock).toBe(false);
      expect(res.reason).toContain('Missing prerequisite skills: pattern-rec');
    });

    it('allows unlocking if prerequisites met and points sufficient', () => {
      const res = canUnlockSkill(mockSkill, ['pattern-rec'], 2);
      expect(res.canUnlock).toBe(true);
      expect(res.reason).toBeUndefined();
    });
  });

  describe('Faction standing and mutual exclusion', () => {
    it('computes correct standing level based on reputation bounds', () => {
      expect(getStandingLevel(-40)).toBe('Hostile');
      expect(getStandingLevel(-30)).toBe('Hostile');
      expect(getStandingLevel(0)).toBe('Neutral');
      expect(getStandingLevel(19)).toBe('Neutral');
      expect(getStandingLevel(20)).toBe('Favored');
      expect(getStandingLevel(59)).toBe('Favored');
      expect(getStandingLevel(60)).toBe('Allied');
      expect(getStandingLevel(100)).toBe('Allied');
    });

    it('warns about mutual exclusion when rival faction is specified', () => {
      const factionA: FactionStanding = {
        id: 'the-collective',
        name: 'The Collective',
        motto: 'Open source the city.',
        description: 'Underground activist hackers.',
        reputation: 40,
        standingLevel: 'Favored',
        perks: ['Reduced black market prices'],
        exclusiveContracts: [],
        opposingFactionId: 'aegis-corp',
      };
      const factionB: FactionStanding = {
        id: 'aegis-corp',
        name: 'Aegis Security',
        motto: 'Order through deterrence.',
        description: 'Corporate defense contractor.',
        reputation: -10,
        standingLevel: 'Neutral',
        perks: ['Access to high tier corporate terminals'],
        exclusiveContracts: [],
        opposingFactionId: 'the-collective',
      };

      const res = checkMutualExclusion(factionA, factionB);
      expect(res.warning).toBe(true);
      expect(res.message).toContain('Warning: Assisting The Collective inflicts reputation penalties on their bitter rival, Aegis Security');
    });
  });

  describe('getDailyBreachSeed', () => {
    it('produces deterministic non-empty seed for date strings', () => {
      const seed1 = getDailyBreachSeed('2026-10-12');
      const seed2 = getDailyBreachSeed('2026-10-12');
      const seed3 = getDailyBreachSeed('2026-10-13');
      expect(seed1).toBe(seed2);
      expect(seed1).not.toBe(seed3);
      expect(seed1.startsWith('DB-')).toBe(true);
    });
  });
});
