import { CoopRole, CoopGuessRecord, CoopStageConfig, CoopPayoutResult } from '@neon-cipher/game-rules';

export interface CoopStageView extends CoopStageConfig {
  completed: boolean;
  secret?: string;
}

export interface CoopSessionView {
  id: string;
  status: 'active' | 'won' | 'lost';
  startedAt: number;
  timeLimitSeconds: number;
  bounty: number;
  payout?: CoopPayoutResult;
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
}

// MOCK: replace with Supabase Realtime Channels & Edge Functions
export const coopService = {
  async startSession(options?: {
    playerRole?: CoopRole;
    difficulty?: number;
    initialAlphaSecret?: string;
    initialBetaSecrets?: string[];
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
