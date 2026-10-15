import { RigHardwareItem, SafehouseProperty, Transaction } from '@/app/api/mock/db';
import { HardwareRailSlot, RigHardwareId, RigPreset } from '@neon-cipher/game-rules';

export interface RigStateResponse {
  hardware: Record<string, RigHardwareItem>;
  equippedRails: Partial<Record<HardwareRailSlot, RigHardwareId | null>>;
  equippedTools: string[];
  inventory: Record<string, number>;
}

export interface EquipRailResult {
  success: boolean;
  equippedRails?: Partial<Record<HardwareRailSlot, RigHardwareId | null>>;
  hardware?: Record<string, RigHardwareItem>;
  swappedModuleId?: RigHardwareId | null;
  message?: string;
  error?: string;
}

export interface ApplyPresetResult {
  success: boolean;
  presetId?: string;
  preset?: RigPreset;
  equippedRails?: Partial<Record<HardwareRailSlot, RigHardwareId | null>>;
  missingModules?: RigHardwareId[];
  hardware?: Record<string, RigHardwareItem>;
  message?: string;
  error?: string;
}

export interface DistrictLeaseInfo {
  id: string;
  name: string;
  district: string;
  dailyDividend: number;
  effect: string;
}

export interface SafehouseStateResponse {
  properties: SafehouseProperty[];
  ownedLeases?: DistrictLeaseInfo[];
  stats: {
    ownedCount: number;
    ownedLeasesCount?: number;
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

  equipRail: async (
    railSlot: HardwareRailSlot,
    hardwareId: RigHardwareId | null
  ): Promise<EquipRailResult> => {
    const res = await fetch('/api/mock/rig/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ railSlot, hardwareId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Failed to equip module to rail.',
      };
    }
    return data;
  },

  applyPreset: async (
    presetId: 'safe_learner' | 'cash_farmer' | 'pvp_duelist'
  ): Promise<ApplyPresetResult> => {
    const res = await fetch('/api/mock/rig/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Failed to apply rig loadout preset.',
      };
    }
    return data;
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
