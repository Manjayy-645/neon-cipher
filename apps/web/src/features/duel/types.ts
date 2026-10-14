import { DuelPacingMode, GUESS_CLOCK_MS } from '@neon-cipher/game-rules';

export type DuelMatchType = 'casual' | 'wager' | 'turf';
export type { DuelPacingMode };
export { GUESS_CLOCK_MS };

export interface DuelRoom {
  id: string;
  name: string;
  host: string;
  matchType: DuelMatchType;
  pacingMode?: DuelPacingMode;
  wager: number;
  ante: number;
  pingMs: number;
  status: 'open' | 'active';
}

export interface DuelGuess {
  guess: string;
  pots: number | null;
  pans: number | null;
  timestamp: number;
  cheatUsed?: boolean;
  isStealth?: boolean;
  falsified?: boolean;
  unmasked?: boolean;
  parityLabel?: 'EVEN' | 'ODD';
}

export interface DuelFeedEvent {
  id: string;
  who: 'player' | 'rival';
  guess: string | null;
  pans: number | null;
  pots: number | null;
  timestamp: number; // ms since startedAt
  isStealth?: boolean;
  unmasked?: boolean;
  cheatUsed?: boolean;
  falsified?: boolean;
  parityLabel?: 'EVEN' | 'ODD';
  sabotageEvent?: {
    toolName: string;
    description: string;
  };
}

export type SabotageEffectType =
  | 'scramble_keypad'
  | 'static_history'
  | 'drain_clock'
  | 'firewall_shield'
  | 'mirror_shield'
  | 'snoop_packet'
  | 'false_flag_echo'
  | 'key_latch'
  | 'logic_bomb'
  | 'parity_jam';

export interface DuelParticipant {
  handle: string;
  avatar: string;
  guesses: DuelGuess[];
  activeEffects: SabotageEffectType[];
  staticExpiry?: number;
  shieldActive: boolean;
  cheatUsed: boolean;
  falseFlagActive?: boolean;
  snoopActive?: boolean;
  defensiveBuffs?: Array<{
    type: 'firewall_patch' | 'mirror_daemon';
    sourceDeckerId: string;
    timestamp: number;
  }>;
  stealthChargesRemaining?: number;
  latchedKeys?: string[];
  parityJamActive?: boolean;
  activeLogicBomb?: {
    targetDigit: string;
    sourceDeckerId: string;
    armedBy?: string;
  };
}

export interface DuelSession {
  id: string;
  matchType: DuelMatchType;
  pacingMode?: DuelPacingMode;
  wager: number;
  ante: number;
  totalPot: number;
  rake: number;
  netPot: number;
  digits: number;
  sharedAttempts: number;
  playerAttempts?: number;
  rivalAttempts?: number;
  maxAttempts?: number;
  guessClockMs?: number;
  playerClockMs?: number;
  rivalClockMs?: number;
  turnClockSeconds: number;
  overallClockSeconds: number;
  startedAt: number;
  status: 'active' | 'player_won' | 'rival_won' | 'draw';
  winner?: 'player' | 'rival' | 'draw';
  finishTimeDeltaSeconds?: number;
  player: DuelParticipant;
  rival: DuelParticipant;
  currentTurn?: 'player' | 'rival';
  feedEvents?: DuelFeedEvent[];
  secret?: string;
}

export interface SabotageTool {
  id: string;
  name: string;
  creditCost: number;
  effect: string;
  durationSeconds?: number;
  effectType: SabotageEffectType;
  nixExplanation?: string;
  counterPlayTip?: string;
}
