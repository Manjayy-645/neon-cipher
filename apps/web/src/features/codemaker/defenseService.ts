import { IceType, CodeDifficultyEstimate, NodeDecayStatus, NodeIncomeStatus } from '@neon-cipher/game-rules/src/index';

// MOCK: replace with Supabase.

export interface NodeDefenseData {
  nodeId: string;
  code: string;
  ice: IceType;
  iceModifiers: IceType[];
  dailyBudget: number;
  finesEarned: number;
  lastMaintainedAt: number;
  lastCollectedAt: number;
  ownerHandle: string;
  decay?: NodeDecayStatus;
  income?: NodeIncomeStatus;
  difficulty?: CodeDifficultyEstimate;
}

export interface DefenseServiceResponse {
  defense?: NodeDefenseData;
  defenses?: Record<string, NodeDefenseData>;
  decay?: NodeDecayStatus;
  income?: NodeIncomeStatus;
  difficulty?: CodeDifficultyEstimate;
  warning?: string;
  success?: boolean;
  amount?: number;
  balance?: number;
  activeAccount?: string;
}

export const defenseService = {
  async getDefense(nodeId: string): Promise<DefenseServiceResponse> {
    const res = await fetch(`/api/mock/defense?nodeId=${encodeURIComponent(nodeId)}`);
    if (!res.ok) {
      throw new Error(`Failed to load defense for node ${nodeId}`);
    }
    return res.json();
  },

  async getAllDefenses(): Promise<{ defenses: Record<string, NodeDefenseData>; activeAccount: string }> {
    const res = await fetch('/api/mock/defense');
    if (!res.ok) {
      throw new Error('Failed to load node defenses');
    }
    return res.json();
  },

  async saveDefense(
    nodeId: string,
    payload: {
      code: string;
      ice?: IceType;
      iceModifiers?: IceType[];
      dailyBudget: number;
    }
  ): Promise<DefenseServiceResponse> {
    const res = await fetch('/api/mock/defense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        code: payload.code,
        ice: payload.ice,
        iceModifiers: payload.iceModifiers,
        dailyBudget: payload.dailyBudget,
      }),
    });
    if (!res.ok) {
      throw new Error('Failed to deploy node defense');
    }
    return res.json();
  },

  async claimYield(nodeId: string): Promise<{ success: boolean; amount: number; balance: number }> {
    const res = await fetch('/api/mock/defense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'claim',
        nodeId,
      }),
    });
    if (!res.ok) {
      throw new Error('Failed to claim turf yield');
    }
    return res.json();
  },

  async switchAccount(handle: string): Promise<{ success: boolean; activeAccount: string }> {
    const res = await fetch('/api/mock/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to switch to account ${handle}`);
    }
    const data = await res.json();
    return { success: true, activeAccount: data.account?.handle || handle };
  },
};
