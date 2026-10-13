import { CatalogItem } from './catalog';

export interface WalletStateResponse {
  credits: number;
  coins: number;
  inventory: Record<string, number>;
  equippedTools: string[];
}

export interface PurchaseResult {
  success: boolean;
  balances?: {
    credits: number;
    coins: number;
  };
  inventory?: Record<string, number>;
  purchasedItem?: CatalogItem;
  message?: string;
  error?: string;
  shortfall?: number;
  currency?: string;
}

export interface EquipResult {
  success: boolean;
  equippedTools?: string[];
  message?: string;
  error?: string;
}

// MOCK: replace with Supabase client calls.
export const walletService = {
  getWallet: async (): Promise<WalletStateResponse> => {
    const res = await fetch('/api/mock/wallet', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch wallet balances.');
    }
    return res.json();
  },

  purchaseItem: async (itemId: string): Promise<PurchaseResult> => {
    const res = await fetch('/api/mock/wallet/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Transaction rejected by vendor.',
        shortfall: data.shortfall,
        currency: data.currency,
      };
    }
    return data;
  },

  equipTools: async (toolIds: string[]): Promise<EquipResult> => {
    const res = await fetch('/api/mock/wallet/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolIds }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update equipped tools.',
      };
    }
    return data;
  },
};
