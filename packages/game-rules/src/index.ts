export type IceType = 'Liar' | 'Drift' | 'Pot-only' | 'Ghost' | 'Sticky' | 'None';
export type Score = { pans: number; pots: number };

export interface IceScore extends Score {
  ice?: IceType;
  totalHits?: number;
  isFalsified?: boolean;
}

export const CITY_NAME = 'Low Meridian';

export * from './characters';
export * from './campaign';
export * from './codemaker';
export * from './duel';
export * from './coop';
export * from './profileRules';
export * from './clues';
export * from './terminalTools';

export interface TierConfig {
  tier: number;
  name: string;
  digits: number;
  allowDuplicates: boolean;
  combinations: number;
  attempts: number;
  timerSeconds: number;
  bountySolo: number;
  bountyCoop?: number;
  tracePenalty?: number;
}

export const TIER_CONFIGS: Record<number, TierConfig> = {
  1: {
    tier: 1,
    name: 'Street',
    digits: 3,
    allowDuplicates: false,
    combinations: 720,
    attempts: 8,
    timerSeconds: 90,
    bountySolo: 120,
    bountyCoop: 160,
    tracePenalty: 5,
  },
  2: {
    tier: 2,
    name: 'Commercial',
    digits: 4,
    allowDuplicates: false,
    combinations: 5040,
    attempts: 7,
    timerSeconds: 60,
    bountySolo: 650,
    bountyCoop: 850,
    tracePenalty: 10,
  },
  3: {
    tier: 3,
    name: 'Corporate',
    digits: 4,
    allowDuplicates: true,
    combinations: 10000,
    attempts: 6,
    timerSeconds: 45,
    bountySolo: 2800,
    bountyCoop: 3600,
    tracePenalty: 15,
  },
  4: {
    tier: 4,
    name: 'Government',
    digits: 5,
    allowDuplicates: false,
    combinations: 30240,
    attempts: 6,
    timerSeconds: 40,
    bountySolo: 9500,
    bountyCoop: 12000,
    tracePenalty: 25,
  },
  5: {
    tier: 5,
    name: 'Megacorp',
    digits: 5,
    allowDuplicates: true,
    combinations: 100000,
    attempts: 5,
    timerSeconds: 30,
    bountySolo: 35000,
    bountyCoop: 45000,
    tracePenalty: 40,
  },
};

export function getTierConfig(tier: number): TierConfig {
  const config = TIER_CONFIGS[tier];
  if (!config) {
    throw new Error(`Invalid tier: ${tier}`);
  }
  return config;
}

export function generateCode(
  length: number,
  allowDuplicates: boolean = false,
  randomFn: () => number = Math.random
): string {
  if (length <= 0 || length > 10) throw new Error('Invalid length');
  if (!allowDuplicates && length > 10) throw new Error('Length cannot exceed 10 if duplicates are not allowed');
  
  let result = '';
  const digits = '0123456789'.split('');
  
  if (allowDuplicates) {
    for (let i = 0; i < length; i++) {
      result += digits[Math.floor(randomFn() * 10)];
    }
  } else {
    // Fisher-Yates shuffle
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(randomFn() * (i + 1));
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

  let pans = 0;
  const secretRemaining: Record<string, number> = {};
  const guessRemaining: Record<string, number> = {};

  // First pass: identify exact matches (pans) and collect remaining characters.
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      pans++;
    } else {
      secretRemaining[secret[i]] = (secretRemaining[secret[i]] || 0) + 1;
      guessRemaining[guess[i]] = (guessRemaining[guess[i]] || 0) + 1;
    }
  }

  let pots = 0;
  // Count wrong-position matches (pots) from the digits left after exact matches.
  for (const digit in guessRemaining) {
    if (secretRemaining[digit]) {
      pots += Math.min(secretRemaining[digit], guessRemaining[digit]);
    }
  }

  return { pans, pots };
}

export function calculateScoreWithIce(
  secret: string,
  guess: string,
  ice: IceType = 'None',
  options?: { isFalsified?: boolean; randomFn?: () => number }
): IceScore {
  const base = calculateScore(secret, guess);

  switch (ice) {
    case 'Pot-only':
      return { pans: base.pans, pots: 0, ice: 'Pot-only' };

    case 'Ghost':
      return { pans: 0, pots: 0, totalHits: base.pans + base.pots, ice: 'Ghost' };

    case 'Liar': {
      if (!options?.isFalsified) {
        return { ...base, ice: 'Liar', isFalsified: false };
      }
      let { pans, pots } = base;
      const totalHits = pans + pots;
      if (totalHits >= secret.length) {
        if (pots > 0) pots--;
        else if (pans > 0) pans--;
      } else if (totalHits === 0) {
        pots++;
      } else {
        const rng = options?.randomFn ? options.randomFn() : Math.random();
        if (rng > 0.5) {
          pots++;
        } else {
          if (pots > 0) pots--;
          else pans--;
        }
      }
      return { pans, pots, ice: 'Liar', isFalsified: true };
    }

    case 'Sticky':
    case 'Drift':
    case 'None':
    default:
      return { ...base, ice };
  }
}

export function driftSecret(
  secret: string,
  allowDuplicates: boolean = false,
  randomFn: () => number = Math.random
): string {
  if (secret.length === 0) return secret;
  const chars = secret.split('');
  const mutateIndex = Math.floor(randomFn() * chars.length);
  const currentDigit = chars[mutateIndex];
  
  const allDigits = '0123456789'.split('');
  const availableDigits = allDigits.filter((d) => {
    if (d === currentDigit) return false;
    if (!allowDuplicates && chars.includes(d)) return false;
    return true;
  });

  if (availableDigits.length === 0) return secret;
  const newDigitIndex = Math.floor(randomFn() * availableDigits.length);
  chars[mutateIndex] = availableDigits[newDigitIndex];
  return chars.join('');
}

export function getStickyLockedDigits(guesses: (string | { guess: string })[]): string[] {
  const locked = new Set<string>();
  for (const item of guesses) {
    const guessStr = typeof item === 'string' ? item : item.guess;
    for (const char of guessStr) {
      locked.add(char);
    }
  }
  return Array.from(locked).sort();
}

export interface ContradictionResult {
  isConsistent: boolean;
  conflictingGuess?: { guess: string; pots: number; pans: number };
  reason?: string;
}

export function isGuessConsistent(
  candidate: string,
  history: Array<{ guess: string; pots: number; pans: number }>
): boolean {
  for (const entry of history) {
    const score = calculateScore(candidate, entry.guess);
    if (score.pots !== entry.pots || score.pans !== entry.pans) {
      return false;
    }
  }
  return true;
}

export function checkContradiction(
  candidate: string,
  history: Array<{ guess: string; pots: number; pans: number }>
): ContradictionResult {
  for (const entry of history) {
    const score = calculateScore(candidate, entry.guess);
    if (score.pots !== entry.pots || score.pans !== entry.pans) {
      return {
        isConsistent: false,
        conflictingGuess: entry,
        reason: `Contradicts guess ${entry.guess} (clue: ${entry.pans} Pan${entry.pans === 1 ? '' : 's'}, ${entry.pots} Pot${entry.pots === 1 ? '' : 's'}; candidate yields ${score.pans} Pan${score.pans === 1 ? '' : 's'}, ${score.pots} Pot${score.pots === 1 ? '' : 's'})`,
      };
    }
  }
  return { isConsistent: true };
}

export function calculateDeadKeys(
  guesses: Array<{ guess: string; pots: number; pans: number }>,
  proMode: boolean = false
): string[] {
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

export function generateCandidatePool(length: number, allowDuplicates: boolean = false): string[] {
  const results: string[] = [];
  if (length <= 0 || length > 10) return results;

  function build(current: string, used: Set<string>) {
    if (current.length === length) {
      results.push(current);
      return;
    }
    for (let d = 0; d <= 9; d++) {
      const char = String(d);
      if (!allowDuplicates && used.has(char)) continue;
      
      used.add(char);
      build(current + char, used);
      used.delete(char);
    }
  }

  build('', new Set<string>());
  return results;
}

export function filterCandidates(
  candidates: string[],
  guess: string,
  score: { pots: number; pans: number }
): string[] {
  return candidates.filter((candidate) => {
    const s = calculateScore(candidate, guess);
    return s.pots === score.pots && s.pans === score.pans;
  });
}

export function makeAiGuess(
  candidatePool: string[],
  history: Array<{ guess: string; pots: number; pans: number }>,
  length: number,
  allowDuplicates: boolean = false,
  randomFn: () => number = Math.random
): string {
  if (candidatePool.length > 0) {
    const idx = Math.floor(randomFn() * candidatePool.length);
    return candidatePool[idx];
  }

  const guessed = new Set(history.map((h) => h.guess));
  for (let i = 0; i < 50; i++) {
    const code = generateCode(length, allowDuplicates, randomFn);
    if (!guessed.has(code)) return code;
  }
  return generateCode(length, allowDuplicates, randomFn);
}
