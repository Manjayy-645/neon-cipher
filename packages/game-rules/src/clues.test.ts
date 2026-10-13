import { describe, it, expect } from 'vitest';
import {
  clueMarks,
  provenDeadDigits,
  bestGuess,
  describeGuess,
  pickConsistentGuess,
  scoreGuess,
  GuessRecord,
} from './clues';

describe('clues.ts: pure game rules for terminal and duel clues', () => {
  describe('scoreGuess', () => {
    it('correctly scores guesses given as arrays or strings', () => {
      expect(scoreGuess([1, 2, 3, 4], [1, 2, 4, 3])).toEqual({ pots: 2, pans: 2 });
      expect(scoreGuess('1234', '1243')).toEqual({ pots: 2, pans: 2 });
      expect(scoreGuess([1, 2, 3], [4, 5, 6])).toEqual({ pots: 0, pans: 0 });
    });
  });

  describe('clueMarks', () => {
    it('orders marks: pots first, then pans, then misses to aggregate length', () => {
      const marks = clueMarks(1, 2, 4);
      expect(marks).toEqual(['pot', 'pan', 'pan', 'miss']);
    });

    it('(0, 0) gives all misses', () => {
      const marks = clueMarks(0, 0, 4);
      expect(marks).toEqual(['miss', 'miss', 'miss', 'miss']);
    });

    it('all pots gives all pots', () => {
      const marks = clueMarks(3, 0, 3);
      expect(marks).toEqual(['pot', 'pot', 'pot']);
    });

    it('respects exact length parameter', () => {
      expect(clueMarks(2, 1, 5)).toEqual(['pot', 'pot', 'pan', 'miss', 'miss']);
    });
  });

  describe('provenDeadDigits', () => {
    it('identifies dead digits only from zero-clue guesses', () => {
      const history: GuessRecord[] = [
        { guess: [1, 2, 3, 4], pots: 1, pans: 0 },
        { guess: [5, 6, 7, 8], pots: 0, pans: 0 },
      ];
      const dead = provenDeadDigits(history);
      expect(dead.has(5)).toBe(true);
      expect(dead.has(6)).toBe(true);
      expect(dead.has(7)).toBe(true);
      expect(dead.has(8)).toBe(true);
      expect(dead.has(1)).toBe(false);
      expect(dead.has(2)).toBe(false);
      expect(dead.size).toBe(4);
    });

    it('handles repeated digits in zero-clue guesses', () => {
      const history: GuessRecord[] = [
        { guess: [9, 9, 0, 0], pots: 0, pans: 0 },
      ];
      const dead = provenDeadDigits(history);
      expect(dead.has(9)).toBe(true);
      expect(dead.has(0)).toBe(true);
      expect(dead.size).toBe(2);
    });

    it('returns empty set if no zero-clue guesses exist', () => {
      const history: GuessRecord[] = [
        { guess: [1, 2, 3], pots: 0, pans: 1 },
      ];
      expect(provenDeadDigits(history).size).toBe(0);
    });
  });

  describe('bestGuess', () => {
    it('returns null for empty history', () => {
      expect(bestGuess([])).toBeNull();
    });

    it('returns the guess with highest pots', () => {
      const history: GuessRecord[] = [
        { guess: [1, 2, 3], pots: 1, pans: 1 },
        { guess: [4, 5, 6], pots: 2, pans: 0 },
        { guess: [7, 8, 9], pots: 0, pans: 2 },
      ];
      expect(bestGuess(history)).toEqual({ guess: [4, 5, 6], pots: 2, pans: 0 });
    });

    it('breaks ties using pans', () => {
      const history: GuessRecord[] = [
        { guess: [1, 2, 3], pots: 1, pans: 0 },
        { guess: [4, 5, 6], pots: 1, pans: 2 },
        { guess: [7, 8, 9], pots: 1, pans: 1 },
      ];
      expect(bestGuess(history)).toEqual({ guess: [4, 5, 6], pots: 1, pans: 2 });
    });

    it('keeps first best when both pots and pans are equal', () => {
      const history: GuessRecord[] = [
        { guess: [1, 2, 3], pots: 1, pans: 1 },
        { guess: [4, 5, 6], pots: 1, pans: 1 },
      ];
      expect(bestGuess(history)).toEqual({ guess: [1, 2, 3], pots: 1, pans: 1 });
    });
  });

  describe('describeGuess', () => {
    it('pluralizes correctly for 1 pot, 2 pans, 1 miss', () => {
      const r: GuessRecord = { guess: [1, 2, 3, 4], pots: 1, pans: 2 };
      expect(describeGuess(r, 4, 2)).toBe('Guess 2: 1 2 3 4. 1 pot, 2 pans, 1 miss.');
    });

    it('pluralizes correctly for 0 pots, 0 pans, 3 misses', () => {
      const r: GuessRecord = { guess: [5, 6, 7], pots: 0, pans: 0 };
      expect(describeGuess(r, 3, 1)).toBe('Guess 1: 5 6 7. 0 pots, 0 pans, 3 misses.');
    });

    it('pluralizes correctly for 1 pot, 1 pan, 0 misses', () => {
      const r: GuessRecord = { guess: [1, 2], pots: 1, pans: 1 };
      expect(describeGuess(r, 2, 4)).toBe('Guess 4: 1 2. 1 pot, 1 pan, 0 misses.');
    });
  });

  describe('pickConsistentGuess', () => {
    it('returns a valid guess with empty history respecting uniqueness', () => {
      const guess = pickConsistentGuess([], { length: 4, allowDuplicates: false }, () => 0);
      expect(guess).not.toBeNull();
      expect(guess).toHaveLength(4);
      expect(new Set(guess!).size).toBe(4);
    });

    it('returns a guess consistent with every history record', () => {
      const history: GuessRecord[] = [
        { guess: [1, 2, 3, 4], pots: 1, pans: 1 },
      ];
      const guess = pickConsistentGuess(history, { length: 4, allowDuplicates: false }, () => 0.5);
      expect(guess).not.toBeNull();
      const score = scoreGuess(guess!, [1, 2, 3, 4]);
      expect(score.pots).toBe(1);
      expect(score.pans).toBe(1);
    });

    it('returns null for contradictory history', () => {
      // It is impossible for 1234 to have both 4 pots AND 0 pots against the same secret
      const history: GuessRecord[] = [
        { guess: [1, 2, 3, 4], pots: 4, pans: 0 },
        { guess: [1, 2, 3, 4], pots: 0, pans: 0 },
      ];
      const guess = pickConsistentGuess(history, { length: 4, allowDuplicates: false }, () => 0);
      expect(guess).toBeNull();
    });

    it('gives repeatable output with seeded rng', () => {
      let seed = 42;
      const fakeRng = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      let seed2 = 42;
      const fakeRng2 = () => {
        seed2 = (seed2 * 9301 + 49297) % 233280;
        return seed2 / 233280;
      };

      const g1 = pickConsistentGuess([], { length: 3, allowDuplicates: false }, fakeRng);
      const g2 = pickConsistentGuess([], { length: 3, allowDuplicates: false }, fakeRng2);
      expect(g1).toEqual(g2);
    });
  });
});
