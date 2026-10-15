import { calculateScore, Score } from './index';

export type DuelMatchType = 'casual' | 'wager' | 'turf';
export type DuelPacingMode = 'simultaneous' | 'turn_based';

export const GUESS_CLOCK_MS = 35000; // 35 seconds per-player guess clock

export interface DuelPotResult {
  playerWager: number;
  totalPot: number;
  rake: number;
  netPot: number;
  rakePercent: number;
}

export type SabotageToolId =
  | 'static_injector'
  | 'firewall_patch'
  | 'clock_drainer'
  | 'packet_sniffer'
  | 'echo_decoy'
  | 'parity_jammer'
  | 'key_latch_virus'
  | 'logic_bomb'
  | 'mirror_daemon';

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

export interface SabotageToolRule {
  id: string;
  name: string;
  creditCost: number;
  durationSeconds?: number;
  effectType: SabotageEffectType;
  description: string;
  isDefensive?: boolean;
  nixExplanation: string;
  counterPlayTip: string;
}

export const STEALTH_GUESS_COST = 150;

/**
 * Canonical catalog of the 9 duel sabotage tools.
 */
export const SABOTAGE_TOOL_CATALOG: Record<SabotageToolId, SabotageToolRule> = {
  static_injector: {
    id: 'static_injector',
    name: 'Static Injector',
    creditCost: 250,
    durationSeconds: 6,
    effectType: 'static_history',
    description: "Obscures opponent's previous guess clues with static for 1 turn.",
    nixExplanation: 'Blinds their history log for one turn so they have to rely on memory.',
    counterPlayTip: 'Note down previous clue counts mentally or pop a Firewall Patch early.',
  },
  firewall_patch: {
    id: 'firewall_patch',
    name: 'Firewall Patch',
    creditCost: 400,
    effectType: 'firewall_shield',
    isDefensive: true,
    description: 'Shields against 1 incoming sabotage attack.',
    nixExplanation: 'Blocks the next nasty trick your rival throws at you. Pop it early if you have a lead.',
    counterPlayTip: 'Bait their shield with a cheap probe before dropping heavy disruptions.',
  },
  clock_drainer: {
    id: 'clock_drainer',
    name: 'Clock Drainer',
    creditCost: 350,
    durationSeconds: 8,
    effectType: 'drain_clock',
    description: "Drains 8 seconds off the opponent's active trace clock.",
    nixExplanation: "Shaves 8 seconds right off their timer. Best used when they're panicking under 20 seconds.",
    counterPlayTip: 'Maintain a steady guess pace and shield up if your clock drops under 25s.',
  },
  packet_sniffer: {
    id: 'packet_sniffer',
    name: 'Packet Sniffer',
    creditCost: 500,
    effectType: 'snoop_packet',
    description: "Reveals 1 confirmed digit hit from the opponent's stream.",
    nixExplanation: "Steals one confirmed number from their deck so you don't have to waste a guess testing it.",
    counterPlayTip: 'Use a Stealth Probe on key test turns to prevent telemetry leaks.',
  },
  echo_decoy: {
    id: 'echo_decoy',
    name: 'Echo Decoy',
    creditCost: 300,
    effectType: 'false_flag_echo',
    description: 'Broadcasts spoofed Pan/Pot counts on the shared feed for your next guess.',
    nixExplanation: 'Sends fake Green and Amber counts to their screen so they chase the wrong numbers.',
    counterPlayTip: 'Compare sequential feedback to spot impossible mathematical jumps.',
  },
  parity_jammer: {
    id: 'parity_jammer',
    name: 'Parity Jammer',
    creditCost: 325,
    effectType: 'parity_jam',
    description: 'Replaces opponent exact Pan/Pot counts with [EVEN] or [ODD] labels for 1 turn.',
    nixExplanation: 'Hides their exact hit numbers behind EVEN or ODD tags. Slows down their math.',
    counterPlayTip: 'EVEN means 0, 2, or 4 hits; ODD means 1 or 3. Compare with earlier turns to deduce.',
  },
  key_latch_virus: {
    id: 'key_latch_virus',
    name: 'Key Latch Virus',
    creditCost: 450,
    effectType: 'key_latch',
    description: "Locks 2 random non-winning digits on the opponent's keypad for 1 turn.",
    nixExplanation: 'Jams two buttons on their keypad for a turn, forcing them to guess around the locked keys.',
    counterPlayTip: 'Two of your keys are mechanically latched for this turn. Test other numbers first—the locks drop after you submit!',
  },
  logic_bomb: {
    id: 'logic_bomb',
    name: 'Logic Bomb',
    creditCost: 550,
    effectType: 'logic_bomb',
    description: 'Plants a hidden trap on a specific digit. If triggered, opponent loses 1 extra attempt and 5 seconds.',
    nixExplanation: "Rig a number you think they're about to test. If they press it, boom—costs them an extra try and 5 seconds.",
    counterPlayTip: 'Rotate digits across turns if you suspect a trap planted on common numbers.',
  },
  mirror_daemon: {
    id: 'mirror_daemon',
    name: 'Mirror Daemon',
    creditCost: 650,
    effectType: 'mirror_shield',
    isDefensive: true,
    description: 'Blocks next incoming offensive sabotage AND reflects 50% of the penalty back onto the attacker.',
    nixExplanation: 'Bounces half of their own sabotage right back in their face.',
    counterPlayTip: 'Hold heavy offensive attacks if an opponent shows defensive resonance.',
  },
};

/**
 * Legacy rules table preserving backward-compatibility with existing tests.
 */
export const SABOTAGE_RULES: Record<string, SabotageToolRule> = {
  ...SABOTAGE_TOOL_CATALOG,
  'tool-static-injector': {
    id: 'tool-static-injector',
    name: 'Static Injector',
    creditCost: 300,
    effectType: 'scramble_keypad',
    description: 'Scrambles opponent keypad positions for their next guess.',
    nixExplanation: 'Scrambles their keypad positions so they hesitate on their next entry.',
    counterPlayTip: 'Take your time reading the scrambled keypad numbers before punching them in.',
  },
  'tool-firewall-patch': {
    id: 'tool-firewall-patch',
    name: 'Firewall Patch',
    creditCost: 450,
    effectType: 'firewall_shield',
    isDefensive: true,
    description: 'Blocks the next incoming sabotage attack during breach.',
    nixExplanation: 'Blocks the next nasty trick your rival throws at you.',
    counterPlayTip: 'Bait their shield before dropping heavy attacks.',
  },
  'tool-blackout-ping': {
    id: 'tool-blackout-ping',
    name: 'Blackout Ping',
    creditCost: 550,
    durationSeconds: 6,
    effectType: 'static_history',
    description: 'Blinds terminal clue history for 6 seconds.',
    nixExplanation: 'Blinds terminal clue history for 6 seconds.',
    counterPlayTip: 'Remember your previous Pan and Pot counts.',
  },
  'tool-trace-accelerator': {
    id: 'tool-trace-accelerator',
    name: 'Trace Accelerator',
    creditCost: 800,
    effectType: 'drain_clock',
    description: 'Removes 10 seconds from security lockdown clock.',
    nixExplanation: 'Shaves 10 seconds right off their clock.',
    counterPlayTip: 'Shield up early if your clock is running thin.',
  },
  'tool-snoop-packet': {
    id: 'tool-snoop-packet',
    name: 'Snoop Packet',
    creditCost: 750,
    effectType: 'snoop_packet',
    description: "Intercepts and unmasks the opponent's hidden or stealth move.",
    nixExplanation: 'Unmasks their hidden or stealth moves.',
    counterPlayTip: 'Mix standard probes with stealth moves to keep them guessing.',
  },
  'tool-false-flag-echo': {
    id: 'tool-false-flag-echo',
    name: 'False Flag Echo',
    creditCost: 1100,
    effectType: 'false_flag_echo',
    description: 'Broadcasts a falsified Pot/Pan clue result on the shared feed for one move.',
    nixExplanation: 'Sends fake Green and Amber counts to their screen so they chase the wrong numbers.',
    counterPlayTip: 'Compare sequential feedback to spot impossible mathematical jumps.',
  },
};

export function normalizeSabotageToolId(id: string): string {
  if (SABOTAGE_RULES[id]) {
    return id;
  }
  const clean = id.toLowerCase().replace(/^tool-/, '').replace(/-/g, '_');
  if (SABOTAGE_TOOL_CATALOG[clean as SabotageToolId]) {
    return clean;
  }
  if (clean === 'blackout_ping') return 'static_injector';
  if (clean === 'trace_accelerator') return 'clock_drainer';
  if (clean === 'snoop_packet') return 'packet_sniffer';
  if (clean === 'false_flag_echo') return 'echo_decoy';
  return id;
}

export function generateFalseFlagClue(
  realPans: number,
  realPots: number,
  digits: number
): { pans: number; pots: number } {
  if (realPans === digits) {
    return { pans: realPans, pots: realPots };
  }
  let fakePans = (realPans + 1) % digits;
  let fakePots = Math.max(0, Math.min(digits - fakePans, realPots === 0 ? 1 : 0));
  if (fakePans === realPans && fakePots === realPots) {
    fakePots = Math.max(0, digits - fakePans - 1);
  }
  return { pans: fakePans, pots: fakePots };
}

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

// ---------------------------------------------------------------------------
// LIFO Defensive Buffs & Sabotage Resolution Queue
// ---------------------------------------------------------------------------

export interface DefensiveBuff {
  type: 'firewall_patch' | 'mirror_daemon';
  sourceDeckerId: string;
  timestamp: number;
}

export interface ActiveLogicBomb {
  targetDigit: string;
  sourceDeckerId: string;
}

export interface DuelGuessRecord {
  guess: string;
  pots: number | null;
  pans: number | null;
  timestamp: number;
  cheatUsed?: boolean;
  isStealth?: boolean;
  falsified?: boolean;
  unmasked?: boolean;
  parityLabel?: 'EVEN' | 'ODD';
  trappedByLogicBomb?: boolean;
}

export interface DuelParticipantState {
  handle: string;
  avatar: string;
  guesses: DuelGuessRecord[];
  activeEffects: SabotageEffectType[];
  shieldActive: boolean;
  cheatUsed: boolean;
  defensiveBuffs?: DefensiveBuff[];
  stealthChargesRemaining?: number;
  latchedKeys?: string[];
  activeLogicBomb?: ActiveLogicBomb;
  parityJamActive?: boolean;
  staticExpiry?: number;
  turnClockSeconds?: number;
}

export interface DuelMatchState {
  id: string;
  secret: string;
  digits: number;
  sharedAttempts: number;
  playerAttempts: number;
  rivalAttempts: number;
  player: DuelParticipantState;
  rival: DuelParticipantState;
  turnClockSeconds: number;
  startedAt: number;
  status: 'active' | 'player_won' | 'rival_won' | 'draw';
}

export interface SabotageAction {
  sourceDeckerId: 'player' | 'rival';
  targetDeckerId: 'player' | 'rival';
  toolId: string;
  targetDigit?: string;
}

export type DuelResolutionEventType =
  | 'SABOTAGE_APPLIED'
  | 'FIREWALL_BLOCKED'
  | 'MIRROR_REFLECTED';

export interface DuelResolutionResult {
  event: DuelResolutionEventType;
  toolId: string;
  sourceDeckerId: string;
  targetDeckerId: string;
  effectApplied?: SabotageEffectType;
  reflectedPenalty?: {
    toolId: string;
    penaltyDescription: string;
    reflectedSeconds?: number;
    reflectedAttempts?: number;
  };
  state: DuelMatchState;
}

/**
 * Resolves a sabotage attack checking active defensive buffs in LIFO order.
 */
export function resolveSabotageAction(
  state: DuelMatchState,
  action: SabotageAction
): DuelResolutionResult {
  const normId = normalizeSabotageToolId(action.toolId);
  const tool = SABOTAGE_TOOL_CATALOG[normId as SabotageToolId] || SABOTAGE_RULES[action.toolId];
  if (!tool) {
    throw new Error(`Unknown sabotage tool: ${action.toolId}`);
  }

  const target = action.targetDeckerId === 'player' ? state.player : state.rival;
  const source = action.sourceDeckerId === 'player' ? state.player : state.rival;

  // Defensive buffs are primed on the user, not applied to target
  if (tool.isDefensive || tool.effectType === 'firewall_shield' || tool.effectType === 'mirror_shield') {
    source.shieldActive = true;
    source.defensiveBuffs = source.defensiveBuffs || [];
    source.defensiveBuffs.push({
      type: normId === 'mirror_daemon' ? 'mirror_daemon' : 'firewall_patch',
      sourceDeckerId: action.sourceDeckerId,
      timestamp: Date.now(),
    });
    return {
      event: 'SABOTAGE_APPLIED',
      toolId: normId,
      sourceDeckerId: action.sourceDeckerId,
      targetDeckerId: action.sourceDeckerId,
      effectApplied: tool.effectType,
      state,
    };
  }

  // Check target's active defensive buffs in LIFO order
  if (target.defensiveBuffs && target.defensiveBuffs.length > 0) {
    const activeBuff = target.defensiveBuffs.pop()!;
    if (target.defensiveBuffs.length === 0) {
      target.shieldActive = false;
    }

    // 1. Mirror Daemon: Nullifies attack and reflects 50% penalty back to source
    if (activeBuff.type === 'mirror_daemon') {
      const reflectedPenalty: DuelResolutionResult['reflectedPenalty'] = {
        toolId: normId,
        penaltyDescription: `50% ${tool.name} penalty reflected back to attacker!`,
      };

      if (normId === 'clock_drainer') {
        const reflectedDrain = 4; // 50% of 8 seconds
        source.turnClockSeconds = Math.max(0, (source.turnClockSeconds ?? state.turnClockSeconds) - reflectedDrain);
        state.turnClockSeconds = Math.max(0, state.turnClockSeconds - reflectedDrain);
        reflectedPenalty.reflectedSeconds = reflectedDrain;
      } else if (normId === 'logic_bomb') {
        const reflectedDrain = 3;
        source.turnClockSeconds = Math.max(0, (source.turnClockSeconds ?? state.turnClockSeconds) - reflectedDrain);
        reflectedPenalty.reflectedSeconds = reflectedDrain;
      } else if (normId === 'static_injector' || normId === 'parity_jammer' || normId === 'key_latch_virus') {
        source.activeEffects = source.activeEffects || [];
        if (!source.activeEffects.includes(tool.effectType)) {
          source.activeEffects.push(tool.effectType);
        }
      }

      return {
        event: 'MIRROR_REFLECTED',
        toolId: normId,
        sourceDeckerId: action.sourceDeckerId,
        targetDeckerId: action.targetDeckerId,
        reflectedPenalty,
        state,
      };
    }

    // 2. Firewall Patch: Absorbs 100% of attack
    if (activeBuff.type === 'firewall_patch') {
      return {
        event: 'FIREWALL_BLOCKED',
        toolId: normId,
        sourceDeckerId: action.sourceDeckerId,
        targetDeckerId: action.targetDeckerId,
        state,
      };
    }
  }

  // 3. Apply attack onto target
  target.activeEffects = target.activeEffects || [];
  if (normId === 'clock_drainer') {
    const drain = 8;
    target.turnClockSeconds = Math.max(0, (target.turnClockSeconds ?? state.turnClockSeconds) - drain);
    state.turnClockSeconds = Math.max(0, state.turnClockSeconds - drain);
    if (!target.activeEffects.includes('drain_clock')) {
      target.activeEffects.push('drain_clock');
    }
  } else if (normId === 'key_latch_virus') {
    const digitsInSecret = new Set(state.secret.split(''));
    const nonSecretDigits = '0123456789'.split('').filter(d => !digitsInSecret.has(d));
    const locked = nonSecretDigits.slice(0, 2);
    target.latchedKeys = locked.length >= 2 ? locked : ['0', '9'];
    if (!target.activeEffects.includes('key_latch')) {
      target.activeEffects.push('key_latch');
    }
  } else if (normId === 'logic_bomb') {
    target.activeLogicBomb = {
      targetDigit: action.targetDigit ?? '7',
      sourceDeckerId: action.sourceDeckerId,
    };
    if (!target.activeEffects.includes('logic_bomb')) {
      target.activeEffects.push('logic_bomb');
    }
  } else if (normId === 'parity_jammer') {
    target.parityJamActive = true;
    if (!target.activeEffects.includes('parity_jam')) {
      target.activeEffects.push('parity_jam');
    }
  } else if (normId === 'static_injector') {
    target.staticExpiry = Date.now() + 6000;
    if (!target.activeEffects.includes('static_history')) {
      target.activeEffects.push('static_history');
    }
  } else {
    if (!target.activeEffects.includes(tool.effectType)) {
      target.activeEffects.push(tool.effectType);
    }
  }

  return {
    event: 'SABOTAGE_APPLIED',
    toolId: normId,
    sourceDeckerId: action.sourceDeckerId,
    targetDeckerId: action.targetDeckerId,
    effectApplied: tool.effectType,
    state,
  };
}

export interface DuelGuessEvaluation {
  valid: boolean;
  rejectionReason?: string;
  playerGuess?: DuelGuessRecord;
  logicBombDetonated?: boolean;
  trappedDigit?: string;
  state: DuelMatchState;
}

/**
 * Evaluates a duel guess enforcing Key Latch guards, Logic Bomb tripwires,
 * and Parity Jammer clue obscuration.
 */
export function evaluateDuelGuess(
  state: DuelMatchState,
  playerType: 'player' | 'rival',
  guess: string,
  options?: { isStealth?: boolean }
): DuelGuessEvaluation {
  const participant = playerType === 'player' ? state.player : state.rival;

  // 1. Guard against Key Latch Virus
  if (participant.latchedKeys && participant.latchedKeys.length > 0) {
    const latched = participant.latchedKeys.find(k => guess.includes(k));
    if (latched) {
      return {
        valid: false,
        rejectionReason: `Key [${latched}] is locked by Key Latch Virus! Guess rejected.`,
        state,
      };
    }
    // Release latch once valid guess submitted
    participant.latchedKeys = undefined;
    participant.activeEffects = participant.activeEffects.filter(e => e !== 'key_latch');
  }

  // 2. Logic Bomb Tripwire
  let logicBombDetonated = false;
  let trappedDigit: string | undefined;
  if (participant.activeLogicBomb && guess.includes(participant.activeLogicBomb.targetDigit)) {
    logicBombDetonated = true;
    trappedDigit = participant.activeLogicBomb.targetDigit;
    if (playerType === 'player') {
      state.playerAttempts = Math.max(0, state.playerAttempts - 1);
    } else {
      state.rivalAttempts = Math.max(0, state.rivalAttempts - 1);
    }
    state.sharedAttempts = Math.max(0, state.sharedAttempts - 1);
    state.turnClockSeconds = Math.max(0, state.turnClockSeconds - 5);
    participant.activeLogicBomb = undefined;
    participant.activeEffects = participant.activeEffects.filter(e => e !== 'logic_bomb');
  }

  // 3. Stealth Probe Charges
  const isStealthRequested = !!options?.isStealth;
  let actualStealth = false;
  if (isStealthRequested) {
    if ((participant.stealthChargesRemaining ?? 0) > 0) {
      participant.stealthChargesRemaining = (participant.stealthChargesRemaining ?? 1) - 1;
      actualStealth = true;
    } else {
      actualStealth = true;
    }
  }

  // 4. Clue calculation
  const score = calculateScore(state.secret, guess);
  let displayPans: number | null = score.pans;
  let displayPots: number | null = score.pots;
  let parityLabel: 'EVEN' | 'ODD' | undefined;

  // Parity Jammer check
  if (participant.parityJamActive || participant.activeEffects.includes('parity_jam')) {
    const totalHits = score.pans + score.pots;
    parityLabel = totalHits % 2 === 0 ? 'EVEN' : 'ODD';
    participant.parityJamActive = false;
    participant.activeEffects = participant.activeEffects.filter(e => e !== 'parity_jam');
  }

  // Deduct standard attempt
  if (playerType === 'player') {
    state.playerAttempts = Math.max(0, state.playerAttempts - 1);
  } else {
    state.rivalAttempts = Math.max(0, state.rivalAttempts - 1);
  }
  state.sharedAttempts = Math.max(0, state.sharedAttempts - 1);

  const guessRecord: DuelGuessRecord = {
    guess,
    pots: displayPots,
    pans: displayPans,
    timestamp: Date.now(),
    isStealth: actualStealth,
    parityLabel,
    trappedByLogicBomb: logicBombDetonated,
  };

  participant.guesses.push(guessRecord);

  // Check win conditions
  if (score.pans === state.digits) {
    state.status = playerType === 'player' ? 'player_won' : 'rival_won';
  } else if (state.playerAttempts <= 0) {
    state.status = 'rival_won';
  } else if (state.rivalAttempts <= 0) {
    state.status = 'player_won';
  }

  return {
    valid: true,
    playerGuess: guessRecord,
    logicBombDetonated,
    trappedDigit,
    state,
  };
}

/**
 * Formats a guess record for transmission across the telemetry link.
 * Masks digits and clues when viewed by the opponent on a stealth probe.
 */
export function formatTelemetryGuess(
  guess: DuelGuessRecord,
  isViewerOwn: boolean
): {
  digits: string[] | string;
  pans: number | string | null;
  pots: number | string | null;
  isStealth: boolean;
  parityLabel?: 'EVEN' | 'ODD';
} {
  if (!isViewerOwn && guess.isStealth && !guess.unmasked) {
    return {
      digits: ['?', '?', '?', '?'],
      pans: null,
      pots: null,
      isStealth: true,
      parityLabel: undefined,
    };
  }

  return {
    digits: guess.guess.split(''),
    pans: guess.pans,
    pots: guess.pots,
    isStealth: !!guess.isStealth,
    parityLabel: guess.parityLabel,
  };
}

// ---------------------------------------------------------------------------
// Nix In-Game Tactical Mentor Guidance Callouts & Briefings
// ---------------------------------------------------------------------------

export type DuelTelemetryEventType =
  | 'parity_jammer'
  | 'key_latch_virus'
  | 'logic_bomb'
  | 'stealth_probe'
  | 'firewall_blocked'
  | 'mirror_reflected';

export interface DuelTelemetryEvent {
  type: DuelTelemetryEventType;
  trappedDigit?: string;
  sourceDecker?: string;
}

export interface NixDialogueTrigger {
  id: string;
  title: string;
  message: string;
  advice: string;
  severity: 'info' | 'warning' | 'alert';
}

/**
 * Contextual "What Just Happened?" Nix tactical explanations for beginners.
 */
export function getNixDuelCallout(event: DuelTelemetryEvent): NixDialogueTrigger {
  switch (event.type) {
    case 'parity_jammer':
      return {
        id: 'callout-parity-jammer',
        title: 'TELEMETRY DISRUPTED: PARITY JAMMER',
        message: "They jammed your readout! 'EVEN' means 0, 2, or 4 hits. 'ODD' means 1 or 3.",
        advice: 'Compare it with your last line to deduce exact numbers!',
        severity: 'warning',
      };
    case 'key_latch_virus':
      return {
        id: 'callout-key-latch',
        title: 'KEYPAD INTRUSION: KEY LATCH VIRUS',
        message: 'Two of your keys are mechanically latched for this turn.',
        advice: 'Test other numbers first—the locks drop after you submit!',
        severity: 'warning',
      };
    case 'logic_bomb':
      return {
        id: 'callout-logic-bomb',
        title: 'TRIPWIRE TRIGGERED: LOGIC BOMB',
        message: `Ouch! They rigged digit [${event.trappedDigit ?? 'X'}] with a Logic Bomb.`,
        advice: 'Shrug it off, we still have attempts left.',
        severity: 'alert',
      };
    case 'stealth_probe':
      return {
        id: 'callout-stealth-probe',
        title: 'OPPONENT STEALTH PROBE DETECTED',
        message: 'They just ran a Stealth Probe! That means they think they are close to the code.',
        advice: 'Pick up the pace or drop a Clock Drainer!',
        severity: 'info',
      };
    case 'firewall_blocked':
      return {
        id: 'callout-firewall-blocked',
        title: 'FIREWALL INTERCEPTION CONFIRMED',
        message: 'Nice! Your shield just ate their sabotage.',
        advice: 'Keep pressing the lock!',
        severity: 'info',
      };
    case 'mirror_reflected':
      return {
        id: 'callout-mirror-reflected',
        title: 'MIRROR DAEMON REFLECTION SUCCESS',
        message: 'Shield reflection hit! Bounced 50% of their sabotage back onto their rig!',
        advice: 'Capitalize on their confusion now!',
        severity: 'info',
      };
  }
}

export const NIX_DUEL_BRIEFINGS = {
  shared_feed: {
    id: 'guide-shared-feed',
    title: 'NIX INTEL: SHARED LOCK TELEMETRY',
    body: "Heads up, rookie: both of you are cracking the exact same lock. Every guess you make shows up on their screen too. If you're one number away from winning, use a [STEALTH PROBE] so they don't steal your homework.",
  },
  sabotage_deck: {
    id: 'guide-sabotage-deck',
    title: 'NIX INTEL: RIG SABOTAGE PROTOCOLS',
    body: "Tap and hold any tool on your rig bar to see what it does before firing. Watch your top alert rail—if Null_Byte hits you with a virus, I'll tell you how to work around it.",
  },
};

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

  // If already tried 4+ times, high probability (60%) of solving
  if (previousGuesses.length >= 4 && Math.random() < 0.6) {
    if (!previousSet.has(secret)) {
      return secret;
    }
  }

  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const chosen: string[] = [];
    const usedIndices = new Set<number>();

    const correctCount = Math.min(secretLength, Math.floor(Math.random() * (secretLength - 1)) + 1);
    for (let i = 0; i < correctCount; i++) {
      const idx = Math.floor(Math.random() * secretLength);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        chosen.push(secret[idx]);
      }
    }

    while (chosen.length < secretLength) {
      const randDigit = digits[Math.floor(Math.random() * digits.length)];
      if (!chosen.includes(randDigit)) {
        chosen.push(randDigit);
      }
    }

    for (let i = chosen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
    }

    const candidate = chosen.join('');
    if (!previousSet.has(candidate)) {
      return candidate;
    }
  }

  for (let i = 0; i < 1000; i++) {
    const candidate = String(1000 + i).slice(-secretLength);
    if (!previousSet.has(candidate)) {
      return candidate;
    }
  }

  return secret;
}
