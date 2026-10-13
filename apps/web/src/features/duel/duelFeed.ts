import { FeedEvent, DuelConfig } from '@/app/api/mock/duel/duelStore';

export type { FeedEvent, DuelConfig };

export interface DuelStateUpdate {
  events: FeedEvent[];
  status: 'playing' | 'won' | 'lost';
  secret?: string;
  rivalAttemptsLeft?: number;
  playerAttemptsLeft?: number;
}

export interface DuelSessionInit {
  duelId: string;
  config: DuelConfig;
  startedAt: number;
  rival: { handle: string };
}

export interface DuelGuessResponse {
  pots: number;
  pans: number;
  status: 'playing' | 'won' | 'lost';
  secret?: string;
}

// MOCK: replace with Supabase Realtime
export const duelFeed = {
  startDuel: async (params?: { tier?: number; nodeId?: string }): Promise<DuelSessionInit> => {
    const res = await fetch('/api/mock/duel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start duel');
    }
    return res.json();
  },

  submitGuess: async (
    duelId: string,
    guess: number[] | string
  ): Promise<DuelGuessResponse> => {
    const res = await fetch(`/api/mock/duel/${duelId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit guess');
    }
    return res.json();
  },

  /**
   * Subscribes to live duel events.
   * Mock implementation uses a 1000ms polling interval.
   * Supabase Realtime will replace polling here without changing component code.
   */
  subscribe: (
    duelId: string,
    onUpdate: (data: DuelStateUpdate) => void
  ): (() => void) => {
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const res = await fetch(`/api/mock/duel/${duelId}/state`);
        if (res.ok && active) {
          const data: DuelStateUpdate = await res.json();
          onUpdate(data);
          if (data.status !== 'playing') {
            active = false; // Stop polling once match is resolved
          }
        }
      } catch {
        // Silently swallow transient network failure during polling
      }
    };

    // Initial immediate poll
    poll();
    const interval = setInterval(poll, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  },
};
