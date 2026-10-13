import { describe, it, expect } from 'vitest';
import { calculateDeadKeys } from './rookieAssist';

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
