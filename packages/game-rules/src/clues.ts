import { calculateScore, generateCandidatePool, filterCandidates } from './index';
import {
  ReplayAnalysisReport,
  ReplayStepAnalysis,
  TurnEfficiencyTag,
} from './profileTypes';

export type Clue = 'pan' | 'pot' | 'miss';

export interface GuessRecord {
  guess: number[];
  pans: number;
  pots: number;
}

export interface CodeConfig {
  length?: number;
  allowDuplicates?: boolean;
}

export function scoreGuess(
  secret: number[] | string,
  guess: number[] | string
): { pans: number; pots: number } {
  const sStr = Array.isArray(secret) ? secret.join('') : secret;
  const gStr = Array.isArray(guess) ? guess.join('') : guess;
  return calculateScore(sStr, gStr);
}

export function clueMarks(pans: number, pots: number, length: number): Clue[] {
  const marks: Clue[] = [];
  for (let i = 0; i < pans; i++) marks.push('pan');
  for (let i = 0; i < pots; i++) marks.push('pot');
  while (marks.length < length) marks.push('miss');
  return marks;
}

export function provenDeadDigits(history: GuessRecord[]): Set<number> {
  const dead = new Set<number>();
  for (const r of history) {
    if (r.pans + r.pots === 0) {
      r.guess.forEach((d) => dead.add(d));
    }
  }
  return dead;
}

export function bestGuess(history: GuessRecord[]): GuessRecord | null {
  let best: GuessRecord | null = null;
  for (const r of history) {
    if (!best || r.pans > best.pans || (r.pans === best.pans && r.pots > best.pots)) {
      best = r;
    }
  }
  return best;
}

export function describeGuess(r: GuessRecord, length: number, index: number): string {
  const misses = length - r.pans - r.pots;
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : w.endsWith('ss') ? 'es' : 's'}`;
  return `Guess ${index}: ${r.guess.join(' ')}. ${plural(r.pans, 'pan')}, ${plural(r.pots, 'pot')}, ${plural(misses, 'miss')}.`;
}

export function pickConsistentGuess(
  history: GuessRecord[],
  config: { length: number; allowDuplicates: boolean },
  rng: () => number = Math.random
): number[] | null {
  const { length, allowDuplicates } = config;
  const candidates: number[][] = [];
  const cur: number[] = [];
  const used: boolean[] = new Array(10).fill(false);

  const consistent = (c: number[]) =>
    history.every((r) => {
      const s = scoreGuess(c, r.guess);
      return s.pans === r.pans && s.pots === r.pots;
    });

  const rec = () => {
    if (cur.length === length) {
      if (consistent(cur)) candidates.push([...cur]);
      return;
    }
    for (let d = 0; d < 10; d++) {
      if (!allowDuplicates && used[d]) continue;
      used[d] = true;
      cur.push(d);
      rec();
      cur.pop();
      used[d] = false;
    }
  };

  rec();
  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)];
}

/**
 * Turn-by-Turn Replay & Candidate Pool Analyzer
 * Evaluates a player's breach history against remaining combinations and identifies efficiency / mistakes.
 */
export function analyzeBreachReplay(
  secretCode: number[] | string,
  guesses: Array<{
    guess: number[] | string;
    pans?: number;
    pots?: number;
    step?: number;
    timeElapsedSeconds?: number;
    note?: string;
  }>,
  config?: CodeConfig
): ReplayAnalysisReport {
  const secretStr = Array.isArray(secretCode) ? secretCode.join('') : String(secretCode);
  const length = config?.length ?? secretStr.length;
  const hasDuplicates = new Set(secretStr).size !== secretStr.length;
  const allowDuplicates = config?.allowDuplicates !== undefined ? config.allowDuplicates : hasDuplicates;

  let currentPool = generateCandidatePool(length, allowDuplicates);
  const initialCandidatesCount = currentPool.length;

  const deadDigits = new Set<string>();
  const steps: ReplayStepAnalysis[] = [];
  let optimalTurnsCount = 0;
  let mistakesCount = 0;
  let solved = false;

  for (let i = 0; i < guesses.length; i++) {
    const r = guesses[i];
    const guessStr = Array.isArray(r.guess) ? r.guess.join('') : String(r.guess);
    const score = calculateScore(secretStr, guessStr);
    const pans = r.pans !== undefined ? r.pans : score.pans;
    const pots = r.pots !== undefined ? r.pots : score.pots;

    const candidatesBefore = currentPool.length;
    const nextPool = filterCandidates(currentPool, guessStr, { pans, pots });
    const candidatesAfter = nextPool.length;

    const eliminatedPercent =
      candidatesBefore > 0
        ? Math.round(((candidatesBefore - candidatesAfter) / candidatesBefore) * 1000) / 10
        : 0;

    const isCurrentSolve = guessStr === secretStr || pans === length;
    if (isCurrentSolve) {
      solved = true;
    }

    let efficiencyTag: TurnEfficiencyTag = 'STANDARD_PROBE';
    let wastedDigits: number[] | undefined;

    // 1. Check for Wasted Dead Digits (re-used digit from earlier 0 Pan / 0 Pot guess)
    const deadInGuess = guessStr.split('').filter((d) => deadDigits.has(d));
    if (deadInGuess.length > 0) {
      wastedDigits = deadInGuess.map(Number);
      efficiencyTag = 'WASTED_DEAD_DIGIT';
      mistakesCount++;
    } else {
      // 2. Check for Missed Position Lock
      let keptWrongPot = false;
      for (let prevIdx = 0; prevIdx < i; prevIdx++) {
        const prevGuess = Array.isArray(guesses[prevIdx].guess)
          ? (guesses[prevIdx].guess as number[]).join('')
          : String(guesses[prevIdx].guess);
        for (let slot = 0; slot < length; slot++) {
          const char = prevGuess[slot];
          if (secretStr[slot] !== char && secretStr.includes(char)) {
            if (guessStr[slot] === char) {
              keptWrongPot = true;
              break;
            }
          }
        }
        if (keptWrongPot) break;
      }

      let movedLockedPan = false;
      if (currentPool.length > 0) {
        for (let slot = 0; slot < length; slot++) {
          const firstChar = currentPool[0][slot];
          const allSame = currentPool.every((c) => c[slot] === firstChar);
          if (allSame && guessStr[slot] !== firstChar) {
            movedLockedPan = true;
            break;
          }
        }
      }

      if (keptWrongPot || movedLockedPan) {
        efficiencyTag = 'MISSED_POSITION_LOCK';
        mistakesCount++;
      } else if (isCurrentSolve) {
        efficiencyTag = 'CLUTCH_SOLVE';
        optimalTurnsCount++;
      } else if (eliminatedPercent >= 75) {
        efficiencyTag = 'OPTIMAL_ELIMINATION';
        optimalTurnsCount++;
      } else {
        efficiencyTag = 'STANDARD_PROBE';
      }
    }

    // Update deadDigits for subsequent turns
    if (pans === 0 && pots === 0) {
      for (const char of guessStr) {
        deadDigits.add(char);
      }
    }

    // Nix Turn Commentary
    let nixCommentary = '';
    const turnNum = i + 1;
    switch (efficiencyTag) {
      case 'WASTED_DEAD_DIGIT':
        nixCommentary = `On Turn ${turnNum}, you typed [${wastedDigits?.join(', ')}], but an earlier probe already proved it wasn't in the cipher! Testing clean numbers narrows combinations much faster.`;
        break;
      case 'MISSED_POSITION_LOCK':
        nixCommentary = `Watch your slot alignment! On Turn ${turnNum}, you repeated a digit in a slot already proven invalid or moved a locked Pan out of position.`;
        break;
      case 'OPTIMAL_ELIMINATION':
        nixCommentary = `Sharp probe! That single guess wiped out ${eliminatedPercent}% of the remaining combinations, cutting the pool down to ${candidatesAfter.toLocaleString()}.`;
        break;
      case 'CLUTCH_SOLVE':
        nixCommentary = `Zero ambiguity left—you isolated the final permutation (${guessStr}) and sealed the crack!`;
        break;
      case 'STANDARD_PROBE':
      default:
        nixCommentary = `Solid deduction probe. Shaved candidate pool from ${candidatesBefore.toLocaleString()} down to ${candidatesAfter.toLocaleString()} possible codes.`;
        break;
    }

    const funnelSummary = `${candidatesBefore.toLocaleString()} -> ${candidatesAfter.toLocaleString()}`;

    steps.push({
      step: turnNum,
      guess: guessStr,
      pans,
      pots,
      candidatesBefore,
      candidatesAfter,
      eliminatedPercent,
      efficiencyTag,
      wastedDigits,
      nixCommentary,
      funnelSummary,
    });

    currentPool = nextPool;
  }

  const funnelFlow =
    `${initialCandidatesCount.toLocaleString()} -> ` +
    steps.map((s) => s.candidatesAfter.toLocaleString()).join(' -> ') +
    (solved ? ' (SOLVED!)' : '');

  let nixOverallReview = '';
  if (mistakesCount === 0 && solved) {
    nixOverallReview =
      'Flawless deduction! You extracted maximum entropy from every clue with surgical discipline.';
  } else if (mistakesCount > 0) {
    nixOverallReview = `Solid breach, but you had ${mistakesCount} inefficient probe${
      mistakesCount === 1 ? '' : 's'
    }. Eliminating dead digits cleanly and locking confirmed Pan slots will save you valuable turns!`;
  } else if (solved) {
    nixOverallReview = 'Breach confirmed. Good clean deduction pace across the terminal.';
  } else {
    nixOverallReview =
      'Breach terminated before full cipher resolution. Study the candidate funnel to identify tighter elimination probes.';
  }

  return {
    initialCandidatesCount,
    finalCandidatesCount: currentPool.length,
    solved,
    totalGuesses: guesses.length,
    optimalTurnsCount,
    mistakesCount,
    steps,
    funnelFlow,
    nixOverallReview,
  };
}
