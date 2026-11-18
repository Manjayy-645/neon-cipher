export type IceType = 'Liar' | 'Drift' | 'Pot-only' | 'Ghost' | 'Sticky' | 'None';

export interface SessionConfig {
  digits: number;
  length?: number;
  allowDuplicates: boolean;
  attempts: number | null;
  maxAttempts?: number | null;
  timerSeconds: number | null;
  tier: number;
  ice: IceType;
  eliminatedDigits?: string[];
  nodeName?: string;
  nodeType?: string;
  bounty?: number;
  district?: string;
  parityDistribution?: {
    evenCount: number;
    oddCount: number;
    stencilFormatted: string;
  } | null;
}

export interface SessionData {
  sessionId: string;
  config: SessionConfig;
  startedAt: number;
}

export interface CampaignReceipt {
  debtReduced: number;
  remainingDebt: number;
  payout: number;
}

export interface GuessResult {
  pots?: number;
  pans?: number;
  totalHits?: number;
  ice?: IceType;
  attemptsLeft?: number | null;
  status: 'active' | 'won' | 'lost';
  secret?: string;
  payout?: number;
  fine?: number;
  burnedHardware?: string;
  refundedAttempt?: boolean;
  firstTurnBonus?: number;
  campaign?: CampaignReceipt | null;
  error?: string;
}

export interface ToolActivationResult {
  success: boolean;
  toolId?: string;
  effectType?: string;
  eliminatedDigit?: string;
  hasDuplicates?: boolean;
  shieldArmed?: boolean;
  timeAddedSeconds?: number;
  timerFrozenSeconds?: number;
  cleanseIce?: boolean;
  cleanseTurns?: number;
  uncorruptedScore?: { pans: number; pots: number };
  extraAttempts?: number;
  revealedSlot?: { slotIndex: number; digit: string };
  autoCrack?: boolean;
  secret?: string;
  message?: string;
  inventory?: Record<string, number>;
  equippedTools?: string[];
  error?: string;
}

export const terminalService = {
  startSession: async (nodeId: string, options?: { courtesy?: boolean }): Promise<SessionData> => {
    const res = await fetch('/api/mock/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, courtesy: options?.courtesy })
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
  },

  useTool: async (sessionId: string, toolId: string): Promise<ToolActivationResult> => {
    const res = await fetch('/api/mock/session/tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, toolId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to activate tool');
    }
    return data;
  },
};

export { useTerminalSession } from './useTerminalSession';
