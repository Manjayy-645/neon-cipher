import { create } from 'zustand';

interface PlayerState {
  credits: number;
  coins: number;
  inventory: Record<string, number>;
  equippedTools: string[];
  handle: string;
  avatarUrl: string;
  sectorHeat: number; // 0 to 100
  nixDismissed: boolean;
  dismissNix: () => void;
  // Wallet cache updates
  setBalances: (credits: number, coins: number) => void;
  setInventory: (inventory: Record<string, number>) => void;
  setEquippedTools: (equippedTools: string[]) => void;
  syncWallet: (data: {
    credits: number;
    coins: number;
    inventory?: Record<string, number>;
    equippedTools?: string[];
  }) => void;
  // Local optimistic helpers (kept for terminal flow compatibility)
  addCredits: (amount: number) => void;
  subtractCredits: (amount: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  credits: 12500,
  coins: 45,
  inventory: {
    'tool-static-injector': 2,
    'tool-firewall-patch': 1,
  },
  equippedTools: ['tool-static-injector'],
  handle: 'ZERO_COOL',
  avatarUrl: '', // Neutral fallback (initial or silhouette)
  sectorHeat: 62, // 62%
  nixDismissed: false,
  dismissNix: () => set({ nixDismissed: true }),

  setBalances: (credits, coins) => set({ credits, coins }),
  setInventory: (inventory) => set({ inventory }),
  setEquippedTools: (equippedTools) => set({ equippedTools }),
  syncWallet: (data) =>
    set((state) => ({
      credits: data.credits,
      coins: data.coins,
      inventory: data.inventory ?? state.inventory,
      equippedTools: data.equippedTools ?? state.equippedTools,
    })),

  addCredits: (amount: number) => set((state) => ({ credits: state.credits + amount })),
  subtractCredits: (amount: number) => set((state) => ({ credits: Math.max(0, state.credits - amount) })),
}));
