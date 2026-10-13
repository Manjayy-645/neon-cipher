import { describe, it, expect } from 'vitest';
import { calculateDeadKeys, checkContradiction, isGuessConsistent } from './rookieAssist';

describe('calculateDeadKeys', () => {
  it('returns empty array when there are no guesses', () => {
    expect(calculateDeadKeys([])).toEqual([]);
  });

  it('identifies dead keys when a guess has 0 pots and 0 pans', () => {
    const guesses = [
      { guess: '1234', pots: 0, pans: 0 }
    ];
    expect(calculateDeadKeys(guesses)).toEqual(['1', '2', '3', '4']);
  });

  it('does not identify dead keys if there are pots or pans', () => {
    const guesses = [
      { guess: '1234', pots: 1, pans: 0 },
      { guess: '5678', pots: 0, pans: 1 }
    ];
    expect(calculateDeadKeys(guesses)).toEqual([]);
  });

  it('combines dead keys from multiple failed guesses and sorts them', () => {
    const guesses = [
      { guess: '1234', pots: 0, pans: 0 },
      { guess: '5678', pots: 0, pans: 0 }
    ];
    expect(calculateDeadKeys(guesses)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
  });

  it('deduplicates dead keys', () => {
    const guesses = [
      { guess: '1122', pots: 0, pans: 0 },
      { guess: '2233', pots: 0, pans: 0 }
    ];
    expect(calculateDeadKeys(guesses)).toEqual(['1', '2', '3']);
  });

  it('returns empty array if proMode is true', () => {
    const guesses = [
      { guess: '1234', pots: 0, pans: 0 }
    ];
    expect(calculateDeadKeys(guesses, true)).toEqual([]);
  });
});

describe('checkContradiction & isGuessConsistent', () => {
  it('identifies contradictory guesses against known clues', () => {
    const history = [
      { guess: '123', pots: 0, pans: 0 },
    ];
    // Re-using digit '1' directly conflicts with 0 pots / 0 pans clue
    expect(isGuessConsistent('145', history)).toBe(false);
    const result = checkContradiction('145', history);
    expect(result.isConsistent).toBe(false);
    expect(result.conflictingGuess?.guess).toBe('123');
  });

  it('approves consistent guesses against history', () => {
    const history = [
      { guess: '123', pots: 1, pans: 0 },
    ];
    // Guess 145 is consistent with 1 being the pot
    expect(isGuessConsistent('145', history)).toBe(true);
    expect(checkContradiction('145', history).isConsistent).toBe(true);
  });
});

