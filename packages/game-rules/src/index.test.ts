import { describe, it, expect } from 'vitest';
import { calculateScore } from './index';

describe('Game Rules Scoring (packages/game-rules)', () => {
  it('Test 1: Hand-verified case from docs (Secret 1123, Guess 1211 -> Pan: 1, Pot: 2)', () => {
    const result = calculateScore('1123', '1211');
    expect(result.pans).toBe(1);
    expect(result.pots).toBe(2);
  });

  it('Test 2: Hand-verified case from docs (Secret 1122, Guess 2211 -> Pan: 0, Pot: 4)', () => {
    const result = calculateScore('1122', '2211');
    expect(result.pans).toBe(0);
    expect(result.pots).toBe(4);
  });

  it('Test 3: Perfect match (Secret 9876, Guess 9876 -> Pan: 4, Pot: 0)', () => {
    const result = calculateScore('9876', '9876');
    expect(result.pans).toBe(4);
    expect(result.pots).toBe(0);
  });

  it('Test 4: No match (Secret 1234, Guess 5678 -> Pan: 0, Pot: 0)', () => {
    const result = calculateScore('1234', '5678');
    expect(result.pans).toBe(0);
    expect(result.pots).toBe(0);
  });
});

