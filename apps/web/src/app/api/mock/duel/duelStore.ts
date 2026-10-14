import {
  generateCode,
  getTierConfig,
  scoreGuess,
  pickConsistentGuess,
  GuessRecord,
} from '@neon-cipher/game-rules';

export interface DuelConfig {
  length: number;
  allowDuplicates: boolean;
  attempts: number;
  timerSeconds: number;
  tier: number;
}

export interface InternalFeedEvent {
  id: string;
  who: 'you' | 'rival';
  guess: number[];
  pots: number;
  pans: number;
  hidden: boolean;
  t: number; // ms since start
}

export interface FeedEvent {
  id: string;
  who: 'you' | 'rival';
  guess: number[] | null;
  pots: number | null;
  pans: number | null;
  hidden: boolean;
  t: number;
}

export interface ServerDuelSession {
  duelId: string;
  config: DuelConfig;
  secret: string;
  startedAt: number;
  status: 'playing' | 'won' | 'lost';
  rival: { handle: string; attemptsLeft: number };
  player: { attemptsLeft: number };
  events: InternalFeedEvent[];
  lastRivalGuessTime: number;
  nextRivalIntervalMs: number;
}

const globalForDuelStore = global as unknown as {
  mockDuels?: Map<string, ServerDuelSession>;
};

export const mockDuels = globalForDuelStore.mockDuels || new Map<string, ServerDuelSession>();

if (process.env.NODE_ENV !== 'production') {
  globalForDuelStore.mockDuels = mockDuels;
}

export function createDuelSession(tierNumber: number = 2): ServerDuelSession {
  const tierConfig = getTierConfig(tierNumber || 2);
  const duelId = `duel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const secret = generateCode(tierConfig.digits, tierConfig.allowDuplicates);

  const config: DuelConfig = {
    length: tierConfig.digits,
    allowDuplicates: tierConfig.allowDuplicates,
    attempts: tierConfig.attempts,
    timerSeconds: tierConfig.timerSeconds,
    tier: tierConfig.tier,
  };

  const startedAt = Date.now();
  const session: ServerDuelSession = {
    duelId,
    config,
    secret,
    startedAt,
    status: 'playing',
    rival: { handle: 'NULL_BYTE', attemptsLeft: tierConfig.attempts },
    player: { attemptsLeft: tierConfig.attempts },
    events: [],
    lastRivalGuessTime: startedAt,
    // 4 to 9 seconds random interval
    nextRivalIntervalMs: 4000 + Math.floor(Math.random() * 5000),
  };

  mockDuels.set(duelId, session);
  return session;
}

export function processRivalAiTurn(session: ServerDuelSession, now: number = Date.now()): void {
  if (session.status !== 'playing') return;

  const elapsedSinceLastRival = now - session.lastRivalGuessTime;
  if (elapsedSinceLastRival < session.nextRivalIntervalMs) return;

  // Build public history from all unhidden guesses of both players
  const publicHistory: GuessRecord[] = session.events
    .filter((e) => !e.hidden)
    .map((e) => ({
      guess: e.guess,
      pots: e.pots,
      pans: e.pans,
    }));

  let aiGuess = pickConsistentGuess(
    publicHistory,
    {
      length: session.config.length,
      allowDuplicates: session.config.allowDuplicates,
    },
    Math.random
  );

  if (!aiGuess) {
    const raw = generateCode(session.config.length, session.config.allowDuplicates);
    aiGuess = raw.split('').map(Number);
  }

  const score = scoreGuess(session.secret, aiGuess);
  const isWinningGuess = score.pans === session.config.length;

  // 1 in 8 chance to be hidden (unless winning guess)
  const isHidden = !isWinningGuess && Math.random() < 0.125;

  const event: InternalFeedEvent = {
    id: `e-rival-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    who: 'rival',
    guess: aiGuess,
    pots: score.pots,
    pans: score.pans,
    hidden: isHidden,
    t: now - session.startedAt,
  };

  session.events.push(event);
  session.rival.attemptsLeft = Math.max(0, session.rival.attemptsLeft - 1);
  session.lastRivalGuessTime = now;
  session.nextRivalIntervalMs = 4000 + Math.floor(Math.random() * 5000);

  if (isWinningGuess) {
    session.status = 'lost'; // Rival breached first
  } else if (session.rival.attemptsLeft <= 0 && session.player.attemptsLeft <= 0) {
    session.status = 'lost';
  }
}
