import { describe, it, expect } from 'vitest';
import {
  generateCode,
  validateGuess,
  calculateScore,
  calculateScoreWithIce,
  driftSecret,
  getStickyLockedDigits,
  checkContradiction,
  isGuessConsistent,
  generateCandidatePool,
  filterCandidates,
  calculateDeadKeys,
  makeAiGuess,
  TIER_CONFIGS,
  getTierConfig,
} from './index';

describe('Number Guessing & Game Rules (packages/game-rules)', () => {
  describe('1. Code Generation with Injected RNG', () => {
    it('generates predictable code with injected randomFn (unique digits)', () => {
      // Mock RNG that returns fixed sequence
      let callCount = 0;
      const mockRng = () => {
        // Return sequence: 0.1, 0.2, 0.3...
        return ((callCount++ * 0.17) % 0.9) + 0.05;
      };

      const code1 = generateCode(4, false, mockRng);
      expect(code1).toHaveLength(4);
      expect(new Set(code1.split('')).size).toBe(4);

      // Same sequence with fresh generator produces identical result
      callCount = 0;
      const code2 = generateCode(4, false, mockRng);
      expect(code2).toBe(code1);
    });

    it('generates predictable code with injected randomFn (duplicates allowed)', () => {
      // RNG returning 0.1, 0.1, 0.1 -> digits 1, 1, 1
      const mockRng = () => 0.15;
      const code = generateCode(3, true, mockRng);
      expect(code).toBe('111');
    });

    it('throws when length is invalid or duplicates are disallowed for length > 10', () => {
      expect(() => generateCode(0)).toThrow('Invalid length');
      expect(() => generateCode(11, true)).toThrow('Invalid length');
      expect(() => generateCode(11, false)).toThrow();
    });
  });

  describe('2. Difficulty Tiers (1 to 5) Specification', () => {
    it('matches exact combination counts from developer handoff: 720, 5040, 10000, 30240, 100000', () => {
      expect(TIER_CONFIGS[1].combinations).toBe(720);
      expect(TIER_CONFIGS[2].combinations).toBe(5040);
      expect(TIER_CONFIGS[3].combinations).toBe(10000);
      expect(TIER_CONFIGS[4].combinations).toBe(30240);
      expect(TIER_CONFIGS[5].combinations).toBe(100000);
    });

    it('has correct attempts and duplicate rules for all 5 tiers', () => {
      // Tier 1: 3 unique, 8 attempts, 90s, $120 bounty
      expect(TIER_CONFIGS[1].digits).toBe(3);
      expect(TIER_CONFIGS[1].allowDuplicates).toBe(false);
      expect(TIER_CONFIGS[1].attempts).toBe(8);
      expect(TIER_CONFIGS[1].timerSeconds).toBe(90);
      expect(TIER_CONFIGS[1].bountySolo).toBe(120);

      // Tier 2: 4 unique, 7 attempts, 60s, $650 bounty
      expect(TIER_CONFIGS[2].digits).toBe(4);
      expect(TIER_CONFIGS[2].allowDuplicates).toBe(false);
      expect(TIER_CONFIGS[2].attempts).toBe(7);
      expect(TIER_CONFIGS[2].timerSeconds).toBe(60);
      expect(TIER_CONFIGS[2].bountySolo).toBe(650);

      // Tier 3: 4 with duplicates, 6 attempts, 45s, $2800 bounty
      expect(TIER_CONFIGS[3].digits).toBe(4);
      expect(TIER_CONFIGS[3].allowDuplicates).toBe(true);
      expect(TIER_CONFIGS[3].attempts).toBe(6);
      expect(TIER_CONFIGS[3].timerSeconds).toBe(45);
      expect(TIER_CONFIGS[3].bountySolo).toBe(2800);

      // Tier 4: 5 unique, 6 attempts, 40s, $9500 bounty
      expect(TIER_CONFIGS[4].digits).toBe(5);
      expect(TIER_CONFIGS[4].allowDuplicates).toBe(false);
      expect(TIER_CONFIGS[4].attempts).toBe(6);
      expect(TIER_CONFIGS[4].timerSeconds).toBe(40);
      expect(TIER_CONFIGS[4].bountySolo).toBe(9500);

      // Tier 5: 5 with duplicates, 5 attempts, 30s, $35000 bounty
      expect(TIER_CONFIGS[5].digits).toBe(5);
      expect(TIER_CONFIGS[5].allowDuplicates).toBe(true);
      expect(TIER_CONFIGS[5].attempts).toBe(5);
      expect(TIER_CONFIGS[5].timerSeconds).toBe(30);
      expect(TIER_CONFIGS[5].bountySolo).toBe(35000);
    });

    it('retrieves tier config via getTierConfig helper', () => {
      expect(getTierConfig(1).name).toBe('Street');
      expect(getTierConfig(5).name).toBe('Megacorp');
      expect(() => getTierConfig(6)).toThrow();
    });
  });

  describe('3. Core Scoring Invariants & Edge Cases', () => {
    it('verifies hand-checked duplicate cases from Handoff docs', () => {
      // secret 1123 vs guess 1211 -> Pot: 1, Pan: 2
      expect(calculateScore('1123', '1211')).toEqual({ pots: 1, pans: 2 });
      // secret 1122 vs guess 2211 -> Pot: 0, Pan: 4
      expect(calculateScore('1122', '2211')).toEqual({ pots: 0, pans: 4 });
    });

    it('ensures duplicate occurrences in guess do not create phantom pans', () => {
      // Secret has only one '1'. Guess has three '1's.
      // Pos 0: 1 vs 1 -> Pot. Remaining '1's in guess have no match -> 0 pans.
      expect(calculateScore('1234', '1115')).toEqual({ pots: 1, pans: 0 });

      // Secret has one '1' at pos 0. Guess has three '1's at pos 1, 2, 3.
      // Pos 0 has no 1. Secret has one '1'. Exactly one pan should be awarded.
      expect(calculateScore('1234', '5111')).toEqual({ pots: 0, pans: 1 });
    });

    it('preserves invariant: pots + pans <= length across arbitrary cases', () => {
      const cases: [string, string][] = [
        ['1234', '4321'],
        ['0000', '0001'],
        ['5432', '2345'],
        ['98765', '56789'],
        ['77889', '98877'],
      ];

      for (const [sec, gue] of cases) {
        const { pots, pans } = calculateScore(sec, gue);
        expect(pots + pans).toBeLessThanOrEqual(sec.length);
      }
    });
  });

  describe('4. ICE Variants Scoring', () => {
    it('Pot-only ICE: suppresses pans to zero', () => {
      // Normally secret 1234 vs 4321 gives 0 pots, 4 pans
      const score = calculateScoreWithIce('1234', '4321', 'Pot-only');
      expect(score.pots).toBe(0);
      expect(score.pans).toBe(0);
      expect(score.ice).toBe('Pot-only');

      // Secret 1234 vs 1324 gives 2 pots, 2 pans -> Pot-only shows pots: 2, pans: 0
      const score2 = calculateScoreWithIce('1234', '1324', 'Pot-only');
      expect(score2.pots).toBe(2);
      expect(score2.pans).toBe(0);
    });

    it('Ghost ICE: merges pots and pans into totalHits', () => {
      // Secret 1234 vs 1324 -> 2 pots, 2 pans -> Ghost totalHits = 4
      const score = calculateScoreWithIce('1234', '1324', 'Ghost');
      expect(score.ice).toBe('Ghost');
      expect(score.totalHits).toBe(4);
      expect(score.pots).toBe(0);
      expect(score.pans).toBe(0);
    });

    it('Liar ICE: falsifies feedback by +/- 1 when falsified option is enabled', () => {
      // Base score: 2 pots, 1 pan
      const base = calculateScore('1234', '1249');
      expect(base).toEqual({ pots: 2, pans: 1 });

      const liarScore = calculateScoreWithIce('1234', '1249', 'Liar', { isFalsified: true });
      expect(liarScore.ice).toBe('Liar');
      expect(liarScore.isFalsified).toBe(true);
      // Liar alters score by 1
      const totalHits = liarScore.pots + liarScore.pans;
      expect(Math.abs(totalHits - (base.pots + base.pans))).toBeGreaterThanOrEqual(1);
    });

    it('Sticky ICE: returns locked digits used in guesses', () => {
      const locked = getStickyLockedDigits(['123', '345', '789']);
      expect(locked).toEqual(['1', '2', '3', '4', '5', '7', '8', '9']);
    });

    it('Drift ICE: mutates one digit of secret', () => {
      const original = '1234';
      // Mock RNG that picks index 2 and a new digit
      const mutated = driftSecret(original, false, () => 0.2);
      expect(mutated).toHaveLength(4);
      expect(mutated).not.toBe(original);
      // Only 1 digit should differ
      let differences = 0;
      for (let i = 0; i < 4; i++) {
        if (mutated[i] !== original[i]) differences++;
      }
      expect(differences).toBe(1);
    });
  });

  describe('5. Contradiction Detection Engine', () => {
    it('identifies when a candidate guess is consistent with previous history', () => {
      const history = [
        { guess: '123', pots: 1, pans: 1 },
      ];

      // If secret were '134', guess '123' would produce 1 pot ('1') and 1 pan ('3'). Consistent!
      expect(isGuessConsistent('134', history)).toBe(true);

      // If secret were '456', guess '123' would produce 0 pots, 0 pans. Contradicts history!
      expect(isGuessConsistent('456', history)).toBe(false);
    });

    it('checkContradiction returns the specific conflicting guess and reason', () => {
      const history = [
        { guess: '123', pots: 0, pans: 0 },
      ];

      // Guessing '145' contains digit '1', which had 0 pots and 0 pans -> contradiction
      const result = checkContradiction('145', history);
      expect(result.isConsistent).toBe(false);
      expect(result.conflictingGuess?.guess).toBe('123');
      expect(result.reason).toContain('Contradicts');
    });

    it('passes clean guess that aligns with all prior clues', () => {
      const history = [
        { guess: '123', pots: 0, pans: 1 },
        { guess: '456', pots: 1, pans: 0 },
      ];

      // Candidate '357' (pan on 3 from 123, pot on 5 from 456)
      const result = checkContradiction('357', history);
      expect(result.isConsistent).toBe(true);
      expect(result.conflictingGuess).toBeUndefined();
    });
  });

  describe('6. Dead Keys Elimination', () => {
    it('eliminates all digits from zero-feedback guesses in rookie mode', () => {
      const guesses = [
        { guess: '123', pots: 0, pans: 0 },
        { guess: '456', pots: 1, pans: 0 },
        { guess: '789', pots: 0, pans: 0 },
      ];

      const dead = calculateDeadKeys(guesses, false);
      expect(dead).toEqual(['1', '2', '3', '7', '8', '9']);
    });

    it('returns empty dead keys array when proMode is enabled', () => {
      const guesses = [
        { guess: '123', pots: 0, pans: 0 },
      ];
      expect(calculateDeadKeys(guesses, true)).toEqual([]);
    });
  });

  describe('7. Deduction Solver & Candidate Pool Engine', () => {
    it('generates exact pool size: 720 for 3-unique, 1000 for 3-duplicates', () => {
      const pool3Unique = generateCandidatePool(3, false);
      expect(pool3Unique.length).toBe(720);

      const pool3Dup = generateCandidatePool(3, true);
      expect(pool3Dup.length).toBe(1000);
    });

    it('filters candidate pool based on score clues', () => {
      const pool = generateCandidatePool(3, false);
      // Secret is 123. Guess 124 -> 2 pots, 0 pans
      const filtered = filterCandidates(pool, '124', { pots: 2, pans: 0 });
      // Only codes like 120, 123, 125, 126, 127, 128, 129 should survive
      expect(filtered).toContain('123');
      expect(filtered).not.toContain('124');
      expect(filtered).not.toContain('421');
      // 3 possible pairs of matching positions (1,2,X), (1,X,4), (X,2,4) with 7 non-overlapping digits each = 21 candidates
      expect(filtered.length).toBe(21);
    });

    it('Null_Byte AI guesser selects a valid candidate that converges on the secret', () => {
      const secret = '482';
      let pool = generateCandidatePool(3, false);
      const history: Array<{ guess: string; pots: number; pans: number }> = [];

      for (let turn = 0; turn < 8; turn++) {
        const guess = makeAiGuess(pool, history, 3, false);
        expect(guess).toHaveLength(3);

        const score = calculateScore(secret, guess);
        history.push({ guess, ...score });
        pool = filterCandidates(pool, guess, score);

        if (score.pots === 3) {
          // Solved!
          expect(guess).toBe(secret);
          break;
        }
      }

      // Solved within reasonable attempts
      const lastGuess = history[history.length - 1];
      expect(lastGuess.guess).toBe(secret);
      expect(lastGuess.pots).toBe(3);
    });
  });
});
