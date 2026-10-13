import { calculateScore, Score } from './index';

export type DuelMatchType = 'casual' | 'wager' | 'turf';

export interface DuelPotResult {
  playerWager: number;
  totalPot: number;
  rake: number;
  netPot: number;
  rakePercent: number;
}

export interface SabotageToolRule {
  id: string;
  name: string;
  creditCost: number;
  durationSeconds?: number;
  effectType: 'scramble_keypad' | 'static_history' | 'drain_clock' | 'firewall_shield';
  description: string;
}

export const SABOTAGE_RULES: Record<string, SabotageToolRule> = {
  'tool-static-injector': {
    id: 'tool-static-injector',
    name: 'Static Injector',
    creditCost: 300,
    effectType: 'scramble_keypad',
    description: 'Scrambles opponent keypad positions for their next guess.',
  },
  'tool-firewall-patch': {
    id: 'tool-firewall-patch',
    name: 'Firewall Patch',
    creditCost: 450,
    effectType: 'firewall_shield',
    description: 'Blocks the next incoming sabotage attack during breach.',
  },
  'tool-blackout-ping': {
    id: 'tool-blackout-ping',
    name: 'Blackout Ping',
    creditCost: 550,
    durationSeconds: 6,
    effectType: 'static_history',
    description: 'Blinds terminal clue history for 6 seconds.',
  },
  'tool-trace-accelerator': {
    id: 'tool-trace-accelerator',
    name: 'Trace Accelerator',
    creditCost: 800,
    effectType: 'drain_clock',
    description: 'Removes 10 seconds from security lockdown clock.',
  },
};

export const DEFAULT_RAKE_PERCENT = 0.10; // 10% syndicate rake

export function calculateDuelPot(
  wager: number,
  rakePercent: number = DEFAULT_RAKE_PERCENT
): DuelPotResult {
  const safeWager = Math.max(0, wager);
  const totalPot = safeWager * 2;
  const rake = Math.floor(totalPot * rakePercent);
  const netPot = totalPot - rake;
  return {
    playerWager: safeWager,
    totalPot,
    rake,
    netPot,
    rakePercent,
  };
}

export function calculateDoubleOrNothing(
  currentPot: number,
  rakePercent: number = DEFAULT_RAKE_PERCENT
): DuelPotResult {
  const doubledPot = currentPot * 2;
  const rake = Math.floor(doubledPot * rakePercent);
  const netPot = doubledPot - rake;
  return {
    playerWager: currentPot,
    totalPot: doubledPot,
    rake,
    netPot,
    rakePercent,
  };
}

export function isExploitAllowed(matchType: DuelMatchType): { allowed: boolean; reason?: string } {
  if (matchType === 'casual') {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Exploits strictly disabled in ranked duels.' };
}

/**
 * Generates a realistic simulated opponent guess for Null_Byte AI.
 * Plays like a smart opponent: deduces matching digits and avoids duplicate guesses.
 */
export function generateNullByteGuess(
  secretLength: number,
  previousGuesses: string[],
  secret: string
): string {
  const digits = '0123456789'.split('');
  const previousSet = new Set(previousGuesses);

  // If already tried 4+ times, high probability (50%) of solving or having 3 pots
  if (previousGuesses.length >= 4 && Math.random() < 0.6) {
    if (!previousSet.has(secret)) {
      return secret;
    }
  }

  // Construct guess by mixing some secret digits and plausible digits
  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const chosen: string[] = [];
    const usedIndices = new Set<number>();

    // Occasionally pick 1-2 correct digits from secret in correct/wrong spots
    const correctCount = Math.min(secretLength, Math.floor(Math.random() * (secretLength - 1)) + 1);
    for (let i = 0; i < correctCount; i++) {
      const idx = Math.floor(Math.random() * secretLength);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        chosen.push(secret[idx]);
      }
    }

    // Fill remaining positions with random digits
    while (chosen.length < secretLength) {
      const randDigit = digits[Math.floor(Math.random() * digits.length)];
      if (!chosen.includes(randDigit)) {
        chosen.push(randDigit);
      }
    }

    // Shuffle the chosen digits to vary order
    for (let i = chosen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
    }

    const candidate = chosen.join('');
    if (!previousSet.has(candidate)) {
      return candidate;
    }
  }

  // Fallback unique candidate
  for (let i = 0; i < 1000; i++) {
    const candidate = String(1000 + i).slice(-secretLength);
    if (!previousSet.has(candidate)) {
      return candidate;
    }
  }

  return secret;
}
