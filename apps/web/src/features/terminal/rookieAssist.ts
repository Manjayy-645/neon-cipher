export interface Guess {
  guess: string;
  pots: number;
  pans: number;
}

/**
 * Calculates which keys are provably dead based on previous guesses.
 * A key is dead if it was used in a guess that resulted in 0 pots and 0 pans.
 */
export function calculateDeadKeys(guesses: Guess[], proMode: boolean = false): string[] {
  if (proMode) return [];
  
  const dead = new Set<string>();
  for (const g of guesses) {
    if (g.pots === 0 && g.pans === 0) {
      for (const char of g.guess) {
        dead.add(char);
      }
    }
  }
  
  return Array.from(dead).sort();
}
