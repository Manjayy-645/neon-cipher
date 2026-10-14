import {
  calculateScore,
  calculateScoreWithIce,
  generateCode,
  validateGuess,
  IceType,
  Score,
} from './index';

/* =========================================================================
   ROLES & COMMON TYPES
   ========================================================================= */

export type CoopRole = 'ALPHA' | 'BRAVO' | 'alpha' | 'bravo' | 'beta';

export function normalizeCoopRole(role: string): 'ALPHA' | 'BRAVO' {
  const upper = role.toUpperCase();
  if (upper === 'BETA' || upper === 'BRAVO') return 'BRAVO';
  return 'ALPHA';
}

export type CoopStageId = 1 | 2 | 3;
export type CoopHeistStatus = 'LOBBY' | 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'WON' | 'LOST';

export type DigitPingStatus = 'CONFIRMED_PRESENT' | 'CONFIRMED_DEAD';

export interface CoopGuessRecord {
  guess: string;
  pots: number;
  pans: number;
  timestamp: number;
  role: CoopRole;
  uncorruptedPans?: number;
  uncorruptedPots?: number;
  isFalsified?: boolean;
}

/* =========================================================================
   STAGE METADATA
   ========================================================================= */

export interface HeistStageInfo {
  stage: CoopStageId;
  name: string;
  title: string;
  digits: number;
  description: string;
  ruleChangeNotice: string;
}

export const HEIST_STAGES: Record<CoopStageId, HeistStageInfo> = {
  1: {
    stage: 1,
    name: 'Perimeter Handshake',
    title: 'STAGE 1 // PERIMETER HANDSHAKE',
    digits: 3,
    description: 'Synchronized dual 3-digit locks. Both operatives must crack within 8 seconds of each other.',
    ruleChangeNotice: 'SYNCHRONIZED DUAL LOCKS: Crack within 8 seconds of your partner!',
  },
  2: {
    stage: 2,
    name: 'Airgap Tunneling',
    title: 'STAGE 2 // AIRGAP TUNNELING',
    digits: 4,
    description: 'Asymmetric 4-digit ICE relay. Bravo cracks code; Alpha scans carrier waves and flushes ICE.',
    ruleChangeNotice: 'ASYMMETRIC RELAY: Bravo cracks 4-digit code. Alpha pings numbers and flushes ICE!',
  },
  3: {
    stage: 3,
    name: 'The Core Vault',
    title: 'STAGE 3 // THE CORE VAULT',
    digits: 5,
    description: '5-digit master lock with 8 shared attempts. Alternate turns and deploy Overdrive.',
    ruleChangeNotice: 'MASTER VAULT: 5 digits, 8 shared attempts. Alternate turns!',
  },
};

/* =========================================================================
   3-STAGE HEIST STATE MACHINE
   ========================================================================= */

export const DEFAULT_SHARED_CLOCK_MS = 120000; // 120 seconds
export const DUAL_KEY_SYNC_WINDOW_MS = 8000;   // 8 seconds
export const OVERDRIVE_FREEZE_MS = 10000;       // 10 seconds

export interface Stage1PlayerLock {
  digits: 3;
  solved: boolean;
  guesses: CoopGuessRecord[];
}

export interface Stage1State {
  alpha: Stage1PlayerLock;
  bravo: Stage1PlayerLock;
  syncWindowMsRemaining: number | null; // 8000 ms once first player cracks
  firstCrackedBy: 'ALPHA' | 'BRAVO' | null;
  resetsCount: number;
}

export interface Stage2State {
  digits: 4;
  ice: IceType;
  reconChargesRemaining: number; // max 3 per stage
  maxReconCharges: number;
  pingedDigits: Record<number, DigitPingStatus>;
  iceFlushedGuessesRemaining: number; // 2 uncorrupted guesses
  guesses: CoopGuessRecord[];
  solved: boolean;
}

export interface Stage3State {
  digits: 5;
  attemptsRemaining: number; // 8 shared attempts
  maxAttempts: number;
  activeTurn: 'ALPHA' | 'BRAVO';
  overdriveUsed: boolean;
  overdriveFrozenMsRemaining: number;
  guesses: CoopGuessRecord[];
  solved: boolean;
}

export interface CoopHeistState {
  id: string;
  status: CoopHeistStatus;
  currentStage: CoopStageId;
  startedAt: number;
  sharedClockMsRemaining: number;
  totalClockMs: number;
  bounty: number;
  payout?: CoopPayoutResult;
  stage1: Stage1State;
  stage2: Stage2State;
  stage3: Stage3State;
}

export interface CoopHeistSecrets {
  alphaStage1Code: string; // 3 unique digits
  bravoStage1Code: string; // 3 unique digits
  stage2Code: string;      // 4 unique digits
  stage3Code: string;      // 5 unique digits
}

export interface CoopHeistConfig {
  id?: string;
  totalClockMs?: number;
  bounty?: number;
  stage2Ice?: IceType;
  initialSecrets?: Partial<CoopHeistSecrets>;
}

export function createCoopHeistState(config?: CoopHeistConfig): {
  state: CoopHeistState;
  secrets: CoopHeistSecrets;
} {
  const totalClock = config?.totalClockMs ?? DEFAULT_SHARED_CLOCK_MS;
  const bounty = config?.bounty ?? 5000;
  const stage2Ice: IceType = config?.stage2Ice ?? 'Liar';

  const secrets: CoopHeistSecrets = {
    alphaStage1Code: config?.initialSecrets?.alphaStage1Code ?? generateCode(3, false),
    bravoStage1Code: config?.initialSecrets?.bravoStage1Code ?? generateCode(3, false),
    stage2Code: config?.initialSecrets?.stage2Code ?? generateCode(4, false),
    stage3Code: config?.initialSecrets?.stage3Code ?? generateCode(5, false),
  };

  const state: CoopHeistState = {
    id: config?.id ?? `heist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    status: 'STAGE_1',
    currentStage: 1,
    startedAt: Date.now(),
    sharedClockMsRemaining: totalClock,
    totalClockMs: totalClock,
    bounty,
    stage1: {
      alpha: { digits: 3, solved: false, guesses: [] },
      bravo: { digits: 3, solved: false, guesses: [] },
      syncWindowMsRemaining: null,
      firstCrackedBy: null,
      resetsCount: 0,
    },
    stage2: {
      digits: 4,
      ice: stage2Ice,
      reconChargesRemaining: 3,
      maxReconCharges: 3,
      pingedDigits: {},
      iceFlushedGuessesRemaining: 0,
      guesses: [],
      solved: false,
    },
    stage3: {
      digits: 5,
      attemptsRemaining: 8,
      maxAttempts: 8,
      activeTurn: 'BRAVO', // Bravo on heavy breach leads, alternating
      overdriveUsed: false,
      overdriveFrozenMsRemaining: 0,
      guesses: [],
      solved: false,
    },
  };

  return { state, secrets };
}

/* =========================================================================
   STAGE 1 LOGIC: PERIMETER HANDSHAKE
   ========================================================================= */

export function submitStage1Guess(
  state: CoopHeistState,
  secrets: CoopHeistSecrets,
  rawRole: CoopRole,
  guess: string
): {
  state: CoopHeistState;
  result: CoopGuessRecord;
  event?: CoopTelemetryEvent;
  message?: string;
} {
  const role = normalizeCoopRole(rawRole);
  if (state.currentStage !== 1 || state.status !== 'STAGE_1') {
    throw new Error('Heist is not in Stage 1');
  }

  const secret = role === 'ALPHA' ? secrets.alphaStage1Code : secrets.bravoStage1Code;
  const playerLock = role === 'ALPHA' ? state.stage1.alpha : state.stage1.bravo;

  if (playerLock.solved) {
    throw new Error(`${role} lock already solved. Awaiting partner sync.`);
  }

  if (!validateGuess(guess, 3, false)) {
    throw new Error('Invalid guess: Stage 1 requires 3 unique digits');
  }

  const score = calculateScore(secret, guess);
  const rec: CoopGuessRecord = {
    guess,
    pans: score.pans,
    pots: score.pots,
    timestamp: Date.now(),
    role,
  };
  playerLock.guesses.push(rec);

  // Check if this guess cracks the player's 3-digit lock
  if (score.pans === 3) {
    playerLock.solved = true;
    const partnerRole: 'ALPHA' | 'BRAVO' = role === 'ALPHA' ? 'BRAVO' : 'ALPHA';
    const partnerLock = partnerRole === 'ALPHA' ? state.stage1.alpha : state.stage1.bravo;

    // Both locks cracked within sync window -> Advance to Stage 2!
    if (partnerLock.solved) {
      state.currentStage = 2;
      state.status = 'STAGE_2';
      state.stage1.syncWindowMsRemaining = null;

      return {
        state,
        result: rec,
        event: {
          type: 'STAGE1_SOLVED',
          stage: 1,
          actorRole: role,
          message: 'Both perimeter locks bypassed in sync! Stage 1 cleared.',
        },
        message: 'Dual-key sync handshake complete! Transitioning to Stage 2: Airgap Tunneling.',
      };
    }

    // First player to crack: start the 8-second Dual-Key Sync Window!
    state.stage1.firstCrackedBy = role;
    state.stage1.syncWindowMsRemaining = DUAL_KEY_SYNC_WINDOW_MS;

    return {
      state,
      result: rec,
      event: {
        type: 'STAGE1_PARTNER_WAITING',
        stage: 1,
        actorRole: role,
        targetRole: partnerRole,
        syncWindowMsRemaining: DUAL_KEY_SYNC_WINDOW_MS,
        message: `${role} cracked lock! 8-second sync window active for ${partnerRole}.`,
      },
      message: `${role} sequence locked! 8.0s dual-key sync window opened. Partner must confirm now!`,
    };
  }

  return {
    state,
    result: rec,
  };
}

export function checkStage1SyncTimeout(
  state: CoopHeistState,
  secrets: CoopHeistSecrets,
  deltaMs: number,
  randomFn: () => number = Math.random
): {
  state: CoopHeistState;
  secrets: CoopHeistSecrets;
  reset: boolean;
  event?: CoopTelemetryEvent;
} {
  if (state.currentStage !== 1 || state.stage1.syncWindowMsRemaining === null) {
    return { state, secrets, reset: false };
  }

  state.stage1.syncWindowMsRemaining = Math.max(0, state.stage1.syncWindowMsRemaining - deltaMs);

  if (state.stage1.syncWindowMsRemaining <= 0) {
    // Sync window expired: Reset perimeter locks
    state.stage1.resetsCount += 1;
    state.stage1.syncWindowMsRemaining = null;
    state.stage1.firstCrackedBy = null;
    state.stage1.alpha.solved = false;
    state.stage1.bravo.solved = false;

    // Re-roll fresh codes
    secrets.alphaStage1Code = generateCode(3, false, randomFn);
    secrets.bravoStage1Code = generateCode(3, false, randomFn);

    const event: CoopTelemetryEvent = {
      type: 'STAGE1_SYNC_EXPIRED',
      stage: 1,
      message: 'Dual-key sync window expired. Perimeter locks rotated with fresh codes!',
    };

    return {
      state,
      secrets,
      reset: true,
      event,
    };
  }

  return { state, secrets, reset: false };
}

/* =========================================================================
   STAGE 2 LOGIC: AIRGAP TUNNELING (ASYMMETRIC RELAY)
   ========================================================================= */

export function pingDigitStage2(
  state: CoopHeistState,
  secrets: CoopHeistSecrets,
  digit: number
): {
  state: CoopHeistState;
  status: DigitPingStatus;
  message: string;
  event: CoopTelemetryEvent;
} {
  if (state.currentStage !== 2) {
    throw new Error('Heist is not in Stage 2');
  }

  if (state.stage2.reconChargesRemaining <= 0) {
    throw new Error('Recon Charges depleted for Stage 2');
  }

  if (digit < 0 || digit > 9) {
    throw new Error('Invalid digit: must be between 0 and 9');
  }

  state.stage2.reconChargesRemaining -= 1;
  const isPresent = secrets.stage2Code.includes(String(digit));
  const status: DigitPingStatus = isPresent ? 'CONFIRMED_PRESENT' : 'CONFIRMED_DEAD';
  state.stage2.pingedDigits[digit] = status;

  const event: CoopTelemetryEvent = {
    type: 'STAGE2_DIGIT_PINGED',
    stage: 2,
    actorRole: 'ALPHA',
    targetRole: 'BRAVO',
    digit,
    message: isPresent
      ? `Digit [${digit}] CONFIRMED PRESENT in Stage 2 cipher.`
      : `Digit [${digit}] CONFIRMED DEAD. Purged from keypad.`,
  };

  const message = isPresent
    ? `Carrier scan: Digit [${digit}] is in the target code! Broadcasted to Bravo.`
    : `Carrier scan: Digit [${digit}] is DEAD (not in code). Crossed off Bravo keypad.`;

  return { state, status, message, event };
}

export function flushIceStage2(state: CoopHeistState): {
  state: CoopHeistState;
  message: string;
  event: CoopTelemetryEvent;
} {
  if (state.currentStage !== 2) {
    throw new Error('Heist is not in Stage 2');
  }

  if (state.stage2.reconChargesRemaining <= 0) {
    throw new Error('Recon Charges depleted for Stage 2');
  }

  state.stage2.reconChargesRemaining -= 1;
  state.stage2.iceFlushedGuessesRemaining = 2;

  // Reveal uncorrupted values for Bravo's historical guesses
  state.stage2.guesses.forEach((g) => {
    if (g.uncorruptedPans !== undefined && g.uncorruptedPots !== undefined) {
      g.pans = g.uncorruptedPans;
      g.pots = g.uncorruptedPots;
      g.isFalsified = false;
    }
  });

  const event: CoopTelemetryEvent = {
    type: 'STAGE2_ICE_FLUSHED',
    stage: 2,
    actorRole: 'ALPHA',
    targetRole: 'BRAVO',
    message: 'Active ICE flushed from Bravo terminal for next 2 guesses. Readouts cleansed.',
  };

  return {
    state,
    message: 'Carrier purge signal deployed! Bravo terminal cleansed of ICE corruption.',
    event,
  };
}

export function submitStage2Guess(
  state: CoopHeistState,
  secrets: CoopHeistSecrets,
  guess: string,
  options?: { randomFn?: () => number; forceCorrupt?: boolean }
): {
  state: CoopHeistState;
  result: CoopGuessRecord;
  event?: CoopTelemetryEvent;
  message?: string;
} {
  if (state.currentStage !== 2 || state.status !== 'STAGE_2') {
    throw new Error('Heist is not in Stage 2');
  }

  if (!validateGuess(guess, 4, false)) {
    throw new Error('Invalid guess: Stage 2 requires 4 unique digits');
  }

  const rawScore = calculateScore(secrets.stage2Code, guess);
  const isIceFlushed = state.stage2.iceFlushedGuessesRemaining > 0;

  let pans = rawScore.pans;
  let pots = rawScore.pots;
  let isFalsified = false;

  if (isIceFlushed) {
    state.stage2.iceFlushedGuessesRemaining -= 1;
  } else if (state.stage2.ice !== 'None' && rawScore.pans < 4) {
    const iceScore = calculateScoreWithIce(secrets.stage2Code, guess, state.stage2.ice, {
      isFalsified: options?.forceCorrupt ?? true,
      randomFn: options?.randomFn ?? Math.random,
    });
    pans = iceScore.pans;
    pots = iceScore.pots;
    isFalsified = Boolean(iceScore.isFalsified);
  }

  const rec: CoopGuessRecord = {
    guess,
    pans,
    pots,
    timestamp: Date.now(),
    role: 'BRAVO',
    uncorruptedPans: rawScore.pans,
    uncorruptedPots: rawScore.pots,
    isFalsified,
  };

  state.stage2.guesses.push(rec);

  // Check if solved
  if (rawScore.pans === 4) {
    state.stage2.solved = true;
    state.currentStage = 3;
    state.status = 'STAGE_3';

    return {
      state,
      result: rec,
      event: {
        type: 'STAGE2_SOLVED',
        stage: 2,
        actorRole: 'BRAVO',
        message: 'Airgap relay breached! Stage 2 completed. Core Vault unmasked.',
      },
      message: 'Airgap bypassed! Master relay routed to Stage 3: The Core Vault.',
    };
  }

  // Detect ICE alert event if corruption occurred
  let event: CoopTelemetryEvent | undefined;
  if (isFalsified) {
    event = {
      type: 'STAGE2_ICE_DETECTED',
      stage: 2,
      targetRole: 'ALPHA',
      message: 'ICE corruption detected on Bravo terminal. Flush recommended.',
    };
  }

  return { state, result: rec, event };
}

/* =========================================================================
   STAGE 3 LOGIC: THE CORE VAULT (5-DIGIT MASTER LOCK)
   ========================================================================= */

export function triggerOverdriveStage3(state: CoopHeistState): {
  state: CoopHeistState;
  message: string;
  event: CoopTelemetryEvent;
} {
  if (state.currentStage !== 3) {
    throw new Error('Overdrive can only be triggered in Stage 3');
  }

  if (state.stage3.overdriveUsed) {
    throw new Error('Overdrive has already been used in this heist');
  }

  state.stage3.overdriveUsed = true;
  state.stage3.overdriveFrozenMsRemaining = OVERDRIVE_FREEZE_MS;
  state.sharedClockMsRemaining += OVERDRIVE_FREEZE_MS;

  const event: CoopTelemetryEvent = {
    type: 'STAGE3_OVERDRIVE_ACTIVATED',
    stage: 3,
    actorRole: 'BRAVO',
    clockMsRemaining: state.sharedClockMsRemaining,
    message: 'Bravo activated OVERDRIVE: Trace Clock frozen for 10.0 seconds!',
  };

  return {
    state,
    message: 'OVERDRIVE ACTIVE! +10 seconds added to master trace clock.',
    event,
  };
}

export function submitStage3Guess(
  state: CoopHeistState,
  secrets: CoopHeistSecrets,
  rawRole: CoopRole,
  guess: string
): {
  state: CoopHeistState;
  result: CoopGuessRecord;
  event?: CoopTelemetryEvent;
  message?: string;
} {
  const role = normalizeCoopRole(rawRole);
  if (state.currentStage !== 3 || state.status !== 'STAGE_3') {
    throw new Error('Heist is not in Stage 3');
  }

  if (state.stage3.attemptsRemaining <= 0) {
    state.status = 'LOST';
    throw new Error('Attempts exhausted for Core Vault');
  }

  if (!validateGuess(guess, 5, false)) {
    throw new Error('Invalid guess: Stage 3 requires 5 unique digits');
  }

  state.stage3.attemptsRemaining -= 1;
  const score = calculateScore(secrets.stage3Code, guess);

  const rec: CoopGuessRecord = {
    guess,
    pans: score.pans,
    pots: score.pots,
    timestamp: Date.now(),
    role,
  };

  state.stage3.guesses.push(rec);

  // Alternate turn
  state.stage3.activeTurn = role === 'ALPHA' ? 'BRAVO' : 'ALPHA';

  if (score.pans === 5) {
    state.stage3.solved = true;
    state.status = 'WON';
    state.payout = calculateCoopPayout(
      state.bounty,
      state.sharedClockMsRemaining,
      state.stage3.attemptsRemaining,
      state.totalClockMs
    );

    return {
      state,
      result: rec,
      event: {
        type: 'HEIST_WON',
        stage: 3,
        actorRole: role,
        clockMsRemaining: state.sharedClockMsRemaining,
        message: 'Core Vault breached! Heist completed successfully.',
      },
      message: `CORE VAULT BREACHED! Dividend payout: ${state.payout.eachPlayerShare} CR per operative.`,
    };
  }

  if (state.stage3.attemptsRemaining <= 0) {
    state.status = 'LOST';
    return {
      state,
      result: rec,
      event: {
        type: 'HEIST_LOST',
        stage: 3,
        message: 'Lockout engaged: All shared intrusion attempts exhausted.',
      },
      message: 'MISSION FAILED: Security attempts exhausted.',
    };
  }

  return { state, result: rec };
}

/* =========================================================================
   PAYOUT COMPUTATION (50/50 SPLIT + STREET CRED)
   ========================================================================= */

export interface CoopPayoutInput {
  baseBounty: number;
  remainingSeconds: number;
  totalSeconds: number;
  stagesCompleted?: number;
}

export interface CoopPayoutResult {
  baseBounty: number;
  speedBonus: number;
  supportBonus?: number;
  efficiencyBonus: number;
  streetCredBonus: number;
  totalPayout: number;
  eachPlayerShare: number;
}

export function calculateCoopPayout(
  inputOrBounty: CoopPayoutInput | number,
  sharedClockMsRemaining: number = 60000,
  attemptsRemaining: number = 4,
  totalClockMs: number = DEFAULT_SHARED_CLOCK_MS
): CoopPayoutResult {
  let base: number;
  let fractionRemaining: number;
  let efficiencyBonus = 0;
  let supportBonus = 0;

  if (typeof inputOrBounty === 'object') {
    base = Math.max(0, inputOrBounty.baseBounty);
    fractionRemaining = inputOrBounty.totalSeconds > 0
      ? Math.max(0, inputOrBounty.remainingSeconds) / inputOrBounty.totalSeconds
      : 0;
    supportBonus = Math.max(0, inputOrBounty.stagesCompleted ?? 3) * 150;
  } else {
    base = Math.max(0, inputOrBounty);
    fractionRemaining = totalClockMs > 0
      ? Math.max(0, sharedClockMsRemaining) / totalClockMs
      : 0;
    efficiencyBonus = Math.max(0, attemptsRemaining) * 100;
  }

  const speedBonus = Math.floor(base * 0.25 * fractionRemaining);
  const totalPayout = base + speedBonus + supportBonus + efficiencyBonus;
  const eachPlayerShare = Math.floor(totalPayout / 2);
  const streetCredBonus = Math.floor(totalPayout * 0.1);

  return {
    baseBounty: base,
    speedBonus,
    supportBonus,
    efficiencyBonus,
    streetCredBonus,
    totalPayout,
    eachPlayerShare,
  };
}

/* =========================================================================
   NIX ROLE-SPECIFIC GUIDANCE & BRIEFINGS
   ========================================================================= */

export type CoopTelemetryEventType =
  | 'STAGE1_PARTNER_WAITING'
  | 'STAGE1_SYNC_EXPIRED'
  | 'STAGE1_SOLVED'
  | 'STAGE2_ICE_DETECTED'
  | 'STAGE2_DIGIT_PINGED'
  | 'STAGE2_ICE_FLUSHED'
  | 'STAGE2_SOLVED'
  | 'STAGE3_LOW_CLOCK'
  | 'STAGE3_OVERDRIVE_ACTIVATED'
  | 'STAGE3_SOLVED'
  | 'HEIST_WON'
  | 'HEIST_LOST'
  | 'STAGE_TRANSITION_1_TO_2'
  | 'STAGE_TRANSITION_2_TO_3';

export interface CoopTelemetryEvent {
  type: CoopTelemetryEventType;
  stage: CoopStageId;
  actorRole?: 'ALPHA' | 'BRAVO';
  targetRole?: 'ALPHA' | 'BRAVO';
  digit?: number;
  syncWindowMsRemaining?: number;
  clockMsRemaining?: number;
  message?: string;
}

export interface NixCoopCallout {
  title: string;
  dialogue: string;
  mood: 'neutral' | 'urgent' | 'warning' | 'encouraging';
  actionPrompt?: string;
}

export function getNixRoleBriefing(role: CoopRole): {
  roleName: string;
  title: string;
  briefing: string;
} {
  const norm = normalizeCoopRole(role);
  if (norm === 'ALPHA') {
    return {
      roleName: 'ALPHA (Recon & Scanner)',
      title: 'OPERATIVE ALPHA // RECONNAISSANCE & TELEMETRY',
      briefing:
        "You're the eyes and ears, Alpha. In Stage 1, crack your lock at the same time as Bravo. In Stage 2, use [PING DIGIT] to test single numbers for Bravo, and hit [FLUSH ICE] whenever the vault scrambles their readout!",
    };
  }

  return {
    roleName: 'BRAVO (Breaker & Execution)',
    title: 'OPERATIVE BRAVO // INFILTRATION & EXECUTION',
    briefing:
      "You're on heavy cracking duty, Bravo. Watch your keypad—whenever Alpha pings a number, it'll light up Green (in the code) or dim out (dead) right on your buttons. Save your [OVERDRIVE] clock-freeze for the final 5-digit vault!",
  };
}

export function getNixCoopCallout(
  event: CoopTelemetryEvent,
  playerRole: CoopRole
): NixCoopCallout | null {
  const role = normalizeCoopRole(playerRole);

  switch (event.type) {
    case 'STAGE1_PARTNER_WAITING': {
      if (event.targetRole === role) {
        return {
          title: 'DUAL-KEY SYNC WINDOW!',
          dialogue:
            "Your partner is locked in! You've got 8 seconds to finish your sequence before the perimeter lock resets!",
          mood: 'urgent',
          actionPrompt: 'CRACK YOUR LOCK NOW (8s)',
        };
      }
      return {
        title: 'HOLDING SYNC LOCK',
        dialogue:
          "You're locked in! Holding the dual-key handshake for 8 seconds while your partner confirms.",
        mood: 'encouraging',
        actionPrompt: 'WAITING FOR PARTNER',
      };
    }

    case 'STAGE1_SYNC_EXPIRED': {
      return {
        title: 'SYNC TIMEOUT // LOCKS ROTATED',
        dialogue:
          "Missed the sync window! The outer locks just rotated. Wait until you're both one guess away, then punch it together.",
        mood: 'warning',
        actionPrompt: 'RE-ENGAGE 3-DIGIT LOCK',
      };
    }

    case 'STAGE1_SOLVED':
    case 'STAGE_TRANSITION_1_TO_2': {
      return {
        title: 'PERIMETER HANDSHAKE COMPLETE',
        dialogue:
          'Perimeter breached! Entering Stage 2: Airgap Tunneling. Bravo takes point on cracking; Alpha, power up your Carrier-Wave Scanner!',
        mood: 'encouraging',
        actionPrompt: role === 'ALPHA' ? 'PREPARE RECON SCANNER' : 'PREPARE 4-DIGIT BREACH',
      };
    }

    case 'STAGE2_ICE_DETECTED': {
      if (role === 'ALPHA') {
        return {
          title: 'ICE DISTORTION ACTIVE',
          dialogue:
            "Bravo's screen is getting fed fake clues by Liar ICE! Hit [FLUSH ICE] on your console to clean up their readout.",
          mood: 'warning',
          actionPrompt: 'TRIGGER [FLUSH ICE]',
        };
      }
      return {
        title: 'ICE TELEMETRY DISTORTION',
        dialogue:
          'Heads up—incoming ICE is distorting your clue readout. Hang tight for Alpha to flush the line.',
        mood: 'warning',
      };
    }

    case 'STAGE2_DIGIT_PINGED': {
      const d = event.digit !== undefined ? event.digit : '?';
      if (role === 'BRAVO') {
        return {
          title: 'CARRIER TELEMETRY RECEIVED',
          dialogue: `Alpha just scanned digit [${d}] for you—check your keypad, I've marked it automatically!`,
          mood: 'encouraging',
          actionPrompt: 'INSPECT KEYPAD HINT',
        };
      }
      return {
        title: 'PING TRANSMITTED',
        dialogue: `Carrier wave confirmed: digit [${d}] status broadcast directly to Bravo's keypad.`,
        mood: 'neutral',
      };
    }

    case 'STAGE2_ICE_FLUSHED': {
      return {
        title: 'ICE CORRUPTION PURGED',
        dialogue:
          'Alpha flushed the carrier line! Readouts restored to true uncorrupted telemetry for 2 turns.',
        mood: 'encouraging',
      };
    }

    case 'STAGE2_SOLVED':
    case 'STAGE_TRANSITION_2_TO_3': {
      return {
        title: 'AIRGAP RELAY BREACHED',
        dialogue:
          'Airgap breached! Core Vault exposed. 5-digit master lock, shared attempt pool. Alternate your inputs and watch the trace!',
        mood: 'encouraging',
        actionPrompt: 'ENGAGE 5-DIGIT CORE VAULT',
      };
    }

    case 'STAGE3_LOW_CLOCK': {
      if (role === 'BRAVO') {
        return {
          title: 'SECURITY COUNTDOWN CRITICAL',
          dialogue:
            "Clock is running dry! Pop your [OVERDRIVE] module now to freeze the trace timer for 10 seconds!",
          mood: 'urgent',
          actionPrompt: 'POP [OVERDRIVE] NOW',
        };
      }
      return {
        title: 'SECURITY COUNTDOWN CRITICAL',
        dialogue: 'Trace lock is closing in! Keep your guesses clean and stay in sync with Bravo!',
        mood: 'urgent',
      };
    }

    case 'STAGE3_OVERDRIVE_ACTIVATED': {
      return {
        title: 'OVERDRIVE ENGAGED',
        dialogue:
          'Bravo popped the Overdrive breaker! Trace clock frozen for 10 seconds. Make every guess count!',
        mood: 'encouraging',
      };
    }

    case 'HEIST_WON': {
      return {
        title: 'VAULT COMPROMISED // CLEAN EXTRACTION',
        dialogue:
          'Master signal unlocked! High-security vault cracked with full synergy. Payout dividend credited 50/50 to the crew.',
        mood: 'encouraging',
      };
    }

    case 'HEIST_LOST': {
      return {
        title: 'MISSION ABORTED // TRACE LOCK ENGAGED',
        dialogue:
          'Lockout protocol activated! Jack out before syndicate countermeasures burn our proxy decks.',
        mood: 'warning',
      };
    }

    default:
      return null;
  }
}

/* =========================================================================
   LEGACY COMPATIBILITY HELPERS (Pre-existing test compatibility)
   ========================================================================= */

export type CoopRewardType = 'remove_dead_digit' | 'extra_attempt' | 'time_freeze';

export interface CoopStageConfig {
  id: number;
  name: string;
  digits: number;
  rewardType: CoopRewardType;
  rewardDescription: string;
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

export function validateCoopGuess(roleOrLength: string | number, guess: string, length?: number): boolean {
  if (typeof guess !== 'string') return false;
  let expectedLength: number;
  if (typeof roleOrLength === 'number') {
    expectedLength = roleOrLength;
  } else if (length !== undefined) {
    expectedLength = length;
  } else {
    const norm = roleOrLength.toLowerCase();
    expectedLength = norm === 'alpha' ? 4 : 3;
  }

  if (guess.length !== expectedLength) return false;
  if (!/^\d+$/.test(guess)) return false;

  const set = new Set(guess.split(''));
  return set.size === expectedLength;
}
