import {
  calculateDeadKeys as calculateDeadKeysEngine,
  checkContradiction as checkContradictionEngine,
  isGuessConsistent as isGuessConsistentEngine,
  type ContradictionResult,
} from '@neon-cipher/game-rules';

export interface Guess {
  guess: string;
  pots: number;
  pans: number;
}

/**
 * Calculates which keys are provably dead based on previous guesses.
 * A key is dead if it was used in a guess that resulted in 0 pots and 0 pans.
 * Re-exported from @neon-cipher/game-rules to adhere to single source of truth.
 */
export const calculateDeadKeys = calculateDeadKeysEngine;
export const checkContradiction = checkContradictionEngine;
export const isGuessConsistent = isGuessConsistentEngine;
export type { ContradictionResult };
