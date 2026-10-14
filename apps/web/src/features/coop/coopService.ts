import {
  CoopRole,
  CoopGuessRecord,
  CoopStageConfig,
  CoopPayoutResult,
  CoopStageId,
  CoopHeistStatus,
  DigitPingStatus,
  CoopTelemetryEvent,
  NixCoopCallout,
  IceType,
} from '@neon-cipher/game-rules';

export interface CoopStageView extends CoopStageConfig {
  completed: boolean;
  secret?: string;
}

export interface CoopHeistView {
  id: string;
  currentStage: CoopStageId;
  status: CoopHeistStatus;
  sharedClockMsRemaining: number;
  totalClockMs: number;
  bounty: number;
  payout?: CoopPayoutResult;
  stage1: {
    alpha: { digits: 3; solved: boolean; guesses: CoopGuessRecord[]; secret?: string };
    bravo: { digits: 3; solved: boolean; guesses: CoopGuessRecord[]; secret?: string };
    syncWindowMsRemaining: number | null;
    firstCrackedBy: 'ALPHA' | 'BRAVO' | null;
    resetsCount: number;
  };
  stage2: {
    digits: 4;
    ice: IceType;
    reconChargesRemaining: number;
    maxReconCharges: number;
    pingedDigits: Record<number, DigitPingStatus>;
    iceFlushedGuessesRemaining: number;
    guesses: CoopGuessRecord[];
    solved: boolean;
    secret?: string;
  };
  stage3: {
    digits: 5;
    attemptsRemaining: number;
    maxAttempts: number;
    activeTurn: 'ALPHA' | 'BRAVO';
    overdriveUsed: boolean;
    overdriveFrozenMsRemaining: number;
    guesses: CoopGuessRecord[];
    solved: boolean;
    secret?: string;
  };
  playerRole: 'ALPHA' | 'BRAVO';
  partnerCallsign: string;
  partnerAction: string;
  isBotPartner: boolean;
  latestTelemetryEvent?: CoopTelemetryEvent;
  nixCallout?: NixCoopCallout | null;
}

export interface CoopSessionView {
  id: string;
  status: 'active' | 'won' | 'lost';
  startedAt: number;
  timeLimitSeconds: number;
  bounty: number;
  payout?: CoopPayoutResult;
  mode?: '3-stage' | 'legacy';
  alpha: {
    digits: number;
    attemptsLeft: number;
    maxAttempts: number;
    guesses: CoopGuessRecord[];
    eliminatedDigits: string[];
    secret?: string;
  };
  beta: {
    currentStageIndex: number;
    guesses: CoopGuessRecord[];
    stages: CoopStageView[];
  };
  heist?: CoopHeistView;
}

// MOCK: replace with Supabase Realtime Channels & Edge Functions
export const coopService = {
  async startSession(options?: {
    playerRole?: CoopRole;
    difficulty?: number;
    initialAlphaSecret?: string;
    initialBetaSecrets?: string[];
    isBotPartner?: boolean;
    stage2Ice?: IceType;
    mode?: '3-stage' | 'legacy';
    bounty?: number;
  }): Promise<CoopSessionView> {
    const res = await fetch('/api/mock/coop/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start co-op session');
    }
    const data = await res.json();
    return data.session;
  },

  async getSession(sessionId: string): Promise<CoopSessionView> {
    const res = await fetch(`/api/mock/coop/session?sessionId=${encodeURIComponent(sessionId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch co-op session');
    }
    const data = await res.json();
    return data.session;
  },

  async submitGuess(params: {
    sessionId: string;
    role: CoopRole;
    guess: string;
  }): Promise<{
    session: CoopSessionView;
    guessRecord: CoopGuessRecord;
    rewardMessage?: string;
    event?: CoopTelemetryEvent;
  }> {
    const res = await fetch('/api/mock/coop/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit co-op guess');
    }
    return res.json();
  },

  async pingDigit(sessionId: string, digit: number): Promise<{
    session: CoopSessionView;
    status: DigitPingStatus;
    message: string;
    event: CoopTelemetryEvent;
  }> {
    const res = await fetch('/api/mock/coop/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'ping', digit }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to ping digit');
    }
    return res.json();
  },

  async flushIce(sessionId: string): Promise<{
    session: CoopSessionView;
    message: string;
    event: CoopTelemetryEvent;
  }> {
    const res = await fetch('/api/mock/coop/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'flush' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to flush ICE');
    }
    return res.json();
  },

  async triggerOverdrive(sessionId: string): Promise<{
    session: CoopSessionView;
    message: string;
    event: CoopTelemetryEvent;
  }> {
    const res = await fetch('/api/mock/coop/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'overdrive' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to trigger overdrive');
    }
    return res.json();
  },

  async syncTick(sessionId: string, deltaMs: number): Promise<{
    session?: CoopSessionView;
    reset?: boolean;
    event?: CoopTelemetryEvent;
  }> {
    const res = await fetch('/api/mock/coop/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'sync_tick', deltaMs }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to sync tick');
    }
    return res.json();
  },

  async simulatePartnerStage(sessionId: string): Promise<{
    session: CoopSessionView;
    guessRecord: CoopGuessRecord;
    rewardMessage?: string;
  }> {
    const res = await fetch('/api/mock/coop/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, simulatePartner: true }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to simulate partner solve');
    }
    return res.json();
  },
};
