export type IceType = 'Liar' | 'Drift' | 'Pot-only' | 'Ghost' | 'Sticky' | 'None';
export type Score = { pots: number; pans: number };

export const CITY_NAME = 'Low Meridian';

export * from './characters';
export * from './campaign';
export * from './codemaker';
export * from './duel';
export * from './profileRules';

export function generateCode(length: number, allowDuplicates: boolean = false): string {
  if (length <= 0 || length > 10) throw new Error('Invalid length');
  if (!allowDuplicates && length > 10) throw new Error('Length cannot exceed 10 if duplicates are not allowed');
  
  let result = '';
  const digits = '0123456789'.split('');
  
  if (allowDuplicates) {
    for (let i = 0; i < length; i++) {
      result += digits[Math.floor(Math.random() * 10)];
    }
  } else {
    // Fisher-Yates shuffle
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    result = digits.slice(0, length).join('');
  }
  return result;
}

export function validateGuess(guess: string, length: number, allowDuplicates: boolean = false): boolean {
  if (guess.length !== length) return false;
  if (!/^\d+$/.test(guess)) return false;
  
  if (!allowDuplicates) {
    const seen = new Set();
    for (const char of guess) {
      if (seen.has(char)) return false;
      seen.add(char);
    }
  }
  return true;
}

export function calculateScore(secret: string, guess: string): Score {
  if (secret.length !== guess.length) {
    throw new Error('Secret and guess must be the same length');
  }

  let pots = 0;
  const secretRemaining: Record<string, number> = {};
  const guessRemaining: Record<string, number> = {};

  // First pass: identify pots and collect remaining characters
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      pots++;
    } else {
      secretRemaining[secret[i]] = (secretRemaining[secret[i]] || 0) + 1;
      guessRemaining[guess[i]] = (guessRemaining[guess[i]] || 0) + 1;
    }
  }

  let pans = 0;
  // Second pass: count pans based on minimum of remaining characters
  for (const digit in guessRemaining) {
    if (secretRemaining[digit]) {
      pans += Math.min(secretRemaining[digit], guessRemaining[digit]);
    }
  }

  return { pots, pans };
}
