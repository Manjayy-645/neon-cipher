export type CoopRole = 'alpha' | 'beta';

export type CoopRewardType = 'remove_dead_digit' | 'extra_attempt' | 'time_freeze';

export interface CoopStageConfig {
  id: number;
  name: string;
  digits: number;
  rewardType: CoopRewardType;
  rewardDescription: string;
}

export interface CoopGuessRecord {
  guess: string;
  pots: number;
  pans: number;
  timestamp: number;
  role: CoopRole;
}

export const COOP_STAGE_TEMPLATES: readonly CoopStageConfig[] = [
  {
    id: 1,
    name: 'Subroutine 01: Firewall Bypass',
    digits: 3,
    rewardType: 'remove_dead_digit',
    rewardDescription: 'Eliminates 1 dead digit from Alpha keypad',
  },
  {
    id: 2,
    name: 'Subroutine 02: Buffer Overflow',
    digits: 3,
    rewardType: 'extra_attempt',
    rewardDescription: 'Grants +1 guess attempt to Alpha',
  },
  {
    id: 3,
    name: 'Subroutine 03: Shroud Override',
    digits: 3,
    rewardType: 'extra_attempt',
    rewardDescription: 'Grants +1 guess attempt to Alpha',
  },
] as const;

/**
 * Returns digits not present in Alpha secret and not yet eliminated.
 */
export function findDeadDigitsForAlpha(
  alphaSecret: string,
  alreadyEliminated: string[]
): string[] {
  const secretDigits = new Set(alphaSecret.split(''));
  const eliminatedSet = new Set(alreadyEliminated);
  const candidates: string[] = [];

  for (let d = 0; d <= 9; d++) {
    const digitStr = String(d);
    if (!secretDigits.has(digitStr) && !eliminatedSet.has(digitStr)) {
      candidates.push(digitStr);
    }
  }

  return candidates;
}

export interface CalculateRewardInput {
  alphaAttempts: number;
  alphaSecret: string;
  eliminatedDigits: string[];
  remainingSeconds: number;
}

export interface CoopRewardResult {
  type: CoopRewardType;
  nextAttempts: number;
  eliminatedDigit?: string;
  eliminatedDigits: string[];
  addedSeconds?: number;
  nextRemainingSeconds: number;
}

export function calculateCoopReward(
  stage: CoopStageConfig,
  input: CalculateRewardInput
): CoopRewardResult {
  let nextAttempts = input.alphaAttempts;
  let nextRemainingSeconds = input.remainingSeconds;
  let eliminatedDigit: string | undefined;
  const currentEliminated = [...input.eliminatedDigits];

  if (stage.rewardType === 'extra_attempt') {
    nextAttempts += 1;
  } else if (stage.rewardType === 'remove_dead_digit') {
    const deadCandidates = findDeadDigitsForAlpha(input.alphaSecret, currentEliminated);
    if (deadCandidates.length > 0) {
      eliminatedDigit = deadCandidates[0];
      currentEliminated.push(eliminatedDigit);
    }
  } else if (stage.rewardType === 'time_freeze') {
    const added = 30;
    nextRemainingSeconds += added;
    return {
      type: 'time_freeze',
      nextAttempts,
      eliminatedDigits: currentEliminated,
      addedSeconds: added,
      nextRemainingSeconds,
    };
  }

  return {
    type: stage.rewardType,
    nextAttempts,
    eliminatedDigit,
    eliminatedDigits: currentEliminated,
    nextRemainingSeconds,
  };
}

/**
 * Validates a Co-op guess.
 * Alpha requires 4 unique digits.
 * Beta requires 3 unique digits.
 */
export function validateCoopGuess(role: CoopRole, guess: string): boolean {
  if (typeof guess !== 'string') return false;
  const expectedLength = role === 'alpha' ? 4 : 3;
  if (guess.length !== expectedLength) return false;
  if (!/^\d+$/.test(guess)) return false;

  // No duplicate digits allowed
  const set = new Set(guess.split(''));
  return set.size === expectedLength;
}

export interface CoopPayoutInput {
  baseBounty: number;
  remainingSeconds: number;
  totalSeconds: number;
  stagesCompleted: number;
}

export interface CoopPayoutResult {
  baseBounty: number;
  speedBonus: number;
  supportBonus: number;
  totalPayout: number;
  eachPlayerShare: number;
}

export function calculateCoopPayout(input: CoopPayoutInput): CoopPayoutResult {
  const base = Math.max(0, input.baseBounty);
  const fractionRemaining = input.totalSeconds > 0
    ? Math.max(0, input.remainingSeconds) / input.totalSeconds
    : 0;

  // Speed bonus up to 25% of base bounty
  const speedBonus = Math.floor(base * 0.25 * fractionRemaining);

  // Support bonus: 150 CR per completed auxiliary stage
  const supportBonus = Math.max(0, input.stagesCompleted) * 150;

  const totalPayout = base + speedBonus + supportBonus;
  const eachPlayerShare = Math.floor(totalPayout / 2);

  return {
    baseBounty: base,
    speedBonus,
    supportBonus,
    totalPayout,
    eachPlayerShare,
  };
}
