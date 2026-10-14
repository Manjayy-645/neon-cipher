export type DuelMatchType = 'casual' | 'wager' | 'turf';

export interface DuelRoom {
  id: string;
  name: string;
  host: string;
  matchType: DuelMatchType;
  wager: number;
  ante: number;
  pingMs: number;
  status: 'open' | 'active';
}

export interface DuelGuess {
  guess: string;
  pots: number;
  pans: number;
  timestamp: number;
  cheatUsed?: boolean;
  isStealth?: boolean;
  falsified?: boolean;
  unmasked?: boolean;
}

export type SabotageEffectType =
  | 'scramble_keypad'
  | 'static_history'
  | 'drain_clock'
  | 'firewall_shield'
  | 'snoop_packet'
  | 'false_flag_echo';

export interface DuelParticipant {
  handle: string;
  avatar: string;
  guesses: DuelGuess[];
  activeEffects: Array<'scramble_keypad' | 'static_history' | 'drain_clock' | 'snoop_packet' | 'false_flag_echo'>;
  staticExpiry?: number;
  shieldActive: boolean;
  cheatUsed: boolean;
  falseFlagActive?: boolean;
  snoopActive?: boolean;
}

export interface DuelSession {
  id: string;
  matchType: DuelMatchType;
  wager: number;
  ante: number;
  totalPot: number;
  rake: number;
  netPot: number;
  digits: number;
  sharedAttempts: number;
  turnClockSeconds: number;
  overallClockSeconds: number;
  startedAt: number;
  status: 'active' | 'player_won' | 'rival_won' | 'draw';
  winner?: 'player' | 'rival' | 'draw';
  finishTimeDeltaSeconds?: number;
  player: DuelParticipant;
  rival: DuelParticipant;
  currentTurn: 'player' | 'rival';
  secret?: string;
}

export interface SabotageTool {
  id: string;
  name: string;
  creditCost: number;
  effect: string;
  durationSeconds?: number;
  effectType: SabotageEffectType;
}
