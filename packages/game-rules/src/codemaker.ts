export type IceType = 'Liar' | 'Drift' | 'Pot-only' | 'Ghost' | 'Sticky' | 'None';

export interface CodeDifficultyEstimate {
  score: number; // 0 to 100
  rating: 'VERY WEAK' | 'WEAK' | 'MODERATE' | 'STRONG' | 'FORTIFIED';
  poolSize: number;
  warning?: string;
  estimatedGuesses: number;
  iceDefenseBonus: number;
}

export interface NodeDecayStatus {
  integrityPercent: number; // 0 to 100
  hoursElapsed: number;
  decayRatePerHour: number;
  isVulnerable: boolean;
  dailyDecayCost: number;
}

export interface NodeIncomeStatus {
  accumulatedYield: number;
  incomeCap: number;
  isCapped: boolean;
  hoursElapsed: number;
  hourlyYield: number;
  percentFilled: number;
}

/**
 * Calculates the exact number of possible unique codes for a given digit length and duplicate rule.
 */
export function possibleCodes(length: number, allowDuplicates: boolean = false): number {
  if (length <= 0 || length > 10) {
    throw new Error('Length must be between 1 and 10 digits');
  }
  if (!allowDuplicates && length > 10) {
    throw new Error('Length cannot exceed 10 if duplicates are not allowed');
  }

  if (allowDuplicates) {
    return Math.pow(10, length);
  }

  // Permutations P(10, length) = 10 * 9 * ... * (10 - length + 1)
  let count = 1;
  for (let i = 0; i < length; i++) {
    count *= (10 - i);
  }
  return count;
}

/**
 * Common weak pattern dictionary
 */
const COMMON_WEAK_DICTIONARY = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '2345', '3456', '4567', '5678', '6789', '0123',
  '4321', '5432', '6543', '7654', '8765', '9876', '3210',
  '1212', '1313', '2424', '6969', '2580', '1122', '1221', '1357', '2468',
  '01234', '12345', '23456', '34567', '45678', '56789',
  '54321', '65432', '76543', '87654', '98765',
]);

/**
 * Detects easily crackable or predictable patterns in a secret code.
 */
export function isCommonWeakCode(code: string): { isWeak: boolean; warning?: string } {
  if (!code || code.length === 0) {
    return { isWeak: true, warning: 'Code cannot be empty.' };
  }

  // 1. All same digit
  const firstChar = code[0];
  if (code.split('').every((c) => c === firstChar)) {
    return {
      isWeak: true,
      warning: `All repeating digits ('${code}'). First attempt on standard crawler list.`,
    };
  }

  // 2. Exact match in common weak dictionary
  if (COMMON_WEAK_DICTIONARY.has(code)) {
    return {
      isWeak: true,
      warning: `Known dictionary sequence ('${code}'). High vulnerability to brute-force dictionaries.`,
    };
  }

  // 3. Ascending sequential run
  let isAscending = true;
  for (let i = 1; i < code.length; i++) {
    const prev = parseInt(code[i - 1], 10);
    const curr = parseInt(code[i], 10);
    if ((prev + 1) % 10 !== curr) {
      isAscending = false;
      break;
    }
  }
  if (isAscending && code.length >= 3) {
    return {
      isWeak: true,
      warning: `Sequential ascending run ('${code}'). Easily intercepted by rookie scanners.`,
    };
  }

  // 4. Descending sequential run
  let isDescending = true;
  for (let i = 1; i < code.length; i++) {
    const prev = parseInt(code[i - 1], 10);
    const curr = parseInt(code[i], 10);
    if ((prev - 1 + 10) % 10 !== curr) {
      isDescending = false;
      break;
    }
  }
  if (isDescending && code.length >= 3) {
    return {
      isWeak: true,
      warning: `Sequential descending run ('${code}'). Trivial reverse scan vector.`,
    };
  }

  // 5. Low unique count for length >= 4
  const uniqueDigits = new Set(code.split('')).size;
  if (code.length >= 4 && uniqueDigits <= 2) {
    return {
      isWeak: true,
      warning: `Low entropy: only ${uniqueDigits} unique digits used. Permutation search space severely reduced.`,
    };
  }

  return { isWeak: false };
}

/**
 * Estimates difficulty score (0-100) and rating for a proposed code and defense loadout.
 */
export function estimateCodeDifficulty(
  code: string,
  allowDuplicates: boolean,
  iceModifiers: IceType[] = []
): CodeDifficultyEstimate {
  const pool = possibleCodes(code.length, allowDuplicates);
  const weakCheck = isCommonWeakCode(code);

  // Base score from length and duplicate space
  let baseScore = 40;
  if (code.length === 3) baseScore = 30;
  if (code.length === 4) baseScore = 50;
  if (code.length === 5) baseScore = 65;
  if (code.length >= 6) baseScore = 75;

  if (allowDuplicates) {
    baseScore += 5; // Repeat digits slightly increase guess permutations
  }

  // ICE defense bonuses
  let iceBonus = 0;
  for (const ice of iceModifiers) {
    switch (ice) {
      case 'Liar':
        iceBonus += 15;
        break;
      case 'Ghost':
        iceBonus += 12;
        break;
      case 'Drift':
        iceBonus += 12;
        break;
      case 'Pot-only':
        iceBonus += 18;
        break;
      case 'Sticky':
        iceBonus += 10;
        break;
      default:
        break;
    }
  }

  let finalScore = baseScore + iceBonus;

  if (weakCheck.isWeak) {
    // Heavily penalize weak choices
    finalScore = Math.min(30, finalScore * 0.4);
  }

  finalScore = Math.max(5, Math.min(100, Math.round(finalScore)));

  let rating: CodeDifficultyEstimate['rating'] = 'MODERATE';
  if (finalScore >= 80) rating = 'FORTIFIED';
  else if (finalScore >= 65) rating = 'STRONG';
  else if (finalScore >= 45) rating = 'MODERATE';
  else if (finalScore >= 25) rating = 'WEAK';
  else rating = 'VERY WEAK';

  // Estimate expected attempts required by an optimal solver
  const estimatedGuesses = weakCheck.isWeak
    ? 2
    : Math.max(3, Math.min(8, Math.round(Math.log10(pool) * 1.5 + iceBonus / 15)));

  return {
    score: finalScore,
    rating,
    poolSize: pool,
    warning: weakCheck.warning,
    estimatedGuesses,
    iceDefenseBonus: iceBonus,
  };
}

/**
 * Calculates integrity decay for an owned node over time.
 */
export function calculateNodeDecay(
  lastMaintainedAt: number,
  now: number = Date.now(),
  defenseBudgetDaily: number = 0
): NodeDecayStatus {
  const hoursElapsed = Math.max(0, (now - lastMaintainedAt) / (1000 * 60 * 60));
  
  // Unfunded nodes decay at 3% per hour.
  // A funded budget of >= 300 credits/day reduces decay to 0.5% per hour.
  let decayRatePerHour = 3.0;
  if (defenseBudgetDaily >= 500) {
    decayRatePerHour = 0.2;
  } else if (defenseBudgetDaily >= 200) {
    decayRatePerHour = 1.0;
  }

  const lostPercent = Math.min(100, hoursElapsed * decayRatePerHour);
  const integrityPercent = Math.max(0, Math.round(100 - lostPercent));

  return {
    integrityPercent,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    decayRatePerHour,
    isVulnerable: integrityPercent <= 25,
    dailyDecayCost: Math.round(defenseBudgetDaily),
  };
}

/**
 * Calculates accumulated income and cap saturation for an owned node.
 */
export function calculateNodeIncome(
  hourlyYield: number,
  lastCollectedAt: number,
  now: number = Date.now(),
  incomeCap: number = 1000
): NodeIncomeStatus {
  const hoursElapsed = Math.max(0, (now - lastCollectedAt) / (1000 * 60 * 60));
  const rawYield = Math.floor(hoursElapsed * hourlyYield);
  const accumulatedYield = Math.min(incomeCap, rawYield);
  const isCapped = accumulatedYield >= incomeCap;
  const percentFilled = Math.min(100, Math.round((accumulatedYield / incomeCap) * 100));

  return {
    accumulatedYield,
    incomeCap,
    isCapped,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    hourlyYield,
    percentFilled,
  };
}

/**
 * Calculates fine earned by defender when an attacker fails to breach an owned node.
 */
export function calculateDefenseFines(attemptsFailed: number, nodeTier: number): number {
  return Math.max(0, attemptsFailed * nodeTier * 75);
}
