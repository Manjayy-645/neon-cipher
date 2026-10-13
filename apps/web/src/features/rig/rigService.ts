import { RigHardwareItem, SafehouseProperty, Transaction } from '@/app/api/mock/db';

export interface RigStateResponse {
  hardware: Record<string, RigHardwareItem>;
  equippedTools: string[];
  inventory: Record<string, number>;
}

export interface SafehouseStateResponse {
  properties: SafehouseProperty[];
  stats: {
    ownedCount: number;
    totalUpkeep: number;
    totalDailyDividend: number;
    totalTraceReduction: number;
  };
}

export interface RepairHardwareResult {
  success: boolean;
  hardware?: RigHardwareItem;
  balances?: {
    credits: number;
    coins: number;
  };
  message?: string;
  error?: string;
  shortfall?: number;
}

export interface SafehouseActionResult {
  success: boolean;
  property?: SafehouseProperty;
  claimedAmount?: number;
  balances?: {
    credits: number;
    coins: number;
  };
  message?: string;
  error?: string;
  shortfall?: number;
}

export interface WalletHistoryResponse {
  transactions: Transaction[];
  totalCount: number;
}

// MOCK: replace with Supabase client calls.
export const rigService = {
  getRig: async (): Promise<RigStateResponse> => {
    const res = await fetch('/api/mock/rig', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch cyberdeck rig status.');
    }
    return res.json();
  },

  repairHardware: async (hardwareId: string): Promise<RepairHardwareResult> => {
    const res = await fetch('/api/mock/rig/repair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hardwareId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Repair refused by system diagnostics.',
        shortfall: data.shortfall,
      };
    }
    return data;
  },

  getSafehouses: async (): Promise<SafehouseStateResponse> => {
    const res = await fetch('/api/mock/safehouse', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch safehouses.');
    }
    return res.json();
  },

  purchaseSafehouse: async (propertyId: string): Promise<SafehouseActionResult> => {
    const res = await fetch('/api/mock/safehouse/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Safehouse transaction rejected.',
        shortfall: data.shortfall,
      };
    }
    return data;
  },

  claimDividends: async (propertyId: string): Promise<SafehouseActionResult> => {
    const res = await fetch('/api/mock/safehouse/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Failed to collect dividend payout.',
      };
    }
    return data;
  },

  getWalletHistory: async (currency?: 'credits' | 'coins'): Promise<WalletHistoryResponse> => {
    const url = currency
      ? `/api/mock/wallet/history?currency=${currency}`
      : '/api/mock/wallet/history';
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch transaction history.');
    }
    return res.json();
  },
};
