export type IceType = 'Liar' | 'Drift' | 'Pot-only' | 'Ghost' | 'Sticky' | 'None';

export interface SessionConfig {
  digits: number;
  allowDuplicates: boolean;
  attempts: number;
  timerSeconds: number;
  tier: number;
  ice: IceType;
  eliminatedDigits?: string[];
}

export interface SessionData {
  sessionId: string;
  config: SessionConfig;
  startedAt: number;
}

export interface GuessResult {
  pots?: number;
  pans?: number;
  totalHits?: number;
  ice?: IceType;
  attemptsLeft?: number;
  status: 'active' | 'won' | 'lost';
  secret?: string;
  payout?: number;
  fine?: number;
  burnedHardware?: string;
  error?: string;
}

export const terminalService = {
  startSession: async (nodeId: string): Promise<SessionData> => {
    const res = await fetch('/api/mock/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start session');
    }
    return res.json();
  },

  submitGuess: async (sessionId: string, guess: string): Promise<GuessResult> => {
    const res = await fetch('/api/mock/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, guess })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit guess');
    }
    return res.json();
  }
};

export { useTerminalSession } from './useTerminalSession';
