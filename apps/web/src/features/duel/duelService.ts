import { DuelRoom, DuelSession, DuelGuess, DuelMatchType } from './types';

// MOCK: replace with Supabase client & Edge Functions
export const duelService = {
  async getRooms(): Promise<DuelRoom[]> {
    const res = await fetch('/api/mock/duel/rooms');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch duel rooms');
    }
    const data = await res.json();
    return data.rooms;
  },

  async createRoom(params: {
    name: string;
    matchType: DuelMatchType;
    wager: number;
    ante?: number;
    host?: string;
  }): Promise<DuelRoom> {
    const res = await fetch('/api/mock/duel/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create room');
    }
    const data = await res.json();
    return data.room;
  },

  async startDuel(params: {
    matchType: DuelMatchType;
    wager: number;
    ante?: number;
    roomId?: string;
    playerHandle?: string;
  }): Promise<DuelSession> {
    const res = await fetch('/api/mock/duel/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start duel');
    }
    const data = await res.json();
    return data.session;
  },

  async submitGuess(
    duelId: string,
    guess: string,
    exploitUsed?: string
  ): Promise<{
    session: DuelSession;
    playerGuess: DuelGuess;
    rivalGuess?: DuelGuess;
  }> {
    const res = await fetch('/api/mock/duel/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duelId, guess, exploitUsed }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit guess');
    }
    return res.json();
  },

  async useSabotage(
    duelId: string,
    toolId: string
  ): Promise<{
    success: boolean;
    shielded: boolean;
    effectApplied?: string;
    remainingCredits: number;
    message: string;
  }> {
    const res = await fetch('/api/mock/duel/sabotage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duelId, toolId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to activate sabotage');
    }
    return res.json();
  },

  async triggerDoubleOrNothing(duelId: string): Promise<DuelSession> {
    const res = await fetch('/api/mock/duel/double', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duelId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to trigger double or nothing');
    }
    const data = await res.json();
    return data.session;
  },
};
