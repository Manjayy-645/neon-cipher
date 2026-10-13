import { calculateScore } from './index';

export type Clue = 'pot' | 'pan' | 'miss';

export interface GuessRecord {
  guess: number[];
  pots: number;
  pans: number;
}

export function scoreGuess(
  secret: number[] | string,
  guess: number[] | string
): { pots: number; pans: number } {
  const sStr = Array.isArray(secret) ? secret.join('') : secret;
  const gStr = Array.isArray(guess) ? guess.join('') : guess;
  return calculateScore(sStr, gStr);
}

export function clueMarks(pots: number, pans: number, length: number): Clue[] {
  const marks: Clue[] = [];
  for (let i = 0; i < pots; i++) marks.push('pot');
  for (let i = 0; i < pans; i++) marks.push('pan');
  while (marks.length < length) marks.push('miss');
  return marks;
}

export function provenDeadDigits(history: GuessRecord[]): Set<number> {
  const dead = new Set<number>();
  for (const r of history) {
    if (r.pots + r.pans === 0) {
      r.guess.forEach((d) => dead.add(d));
    }
  }
  return dead;
}

export function bestGuess(history: GuessRecord[]): GuessRecord | null {
  let best: GuessRecord | null = null;
  for (const r of history) {
    if (!best || r.pots > best.pots || (r.pots === best.pots && r.pans > best.pans)) {
      best = r;
    }
  }
  return best;
}

export function describeGuess(r: GuessRecord, length: number, index: number): string {
  const misses = length - r.pots - r.pans;
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : w.endsWith('ss') ? 'es' : 's'}`;
  return `Guess ${index}: ${r.guess.join(' ')}. ${plural(r.pots, 'pot')}, ${plural(r.pans, 'pan')}, ${plural(misses, 'miss')}.`;
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
      return s.pots === r.pots && s.pans === r.pans;
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
