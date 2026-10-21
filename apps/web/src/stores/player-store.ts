import { create } from 'zustand';

interface PlayerState {
  credits: number;
  coins: number;
  inventory: Record<string, number>;
  equippedTools: string[];
  handle: string;
  callsign: string;
  avatarUrl: string;
  sectorHeat: number; // 0 to 100
  nixDismissed: boolean;
  // Profile stats
  level: number;
  xp: number;
  nextLevelXp: number;
  breachesWon: number;
  breachesTotal: number;
  careerEarnings: number;

  dismissNix: () => void;
  // Wallet cache updates
  setBalances: (credits: number, coins: number) => void;
  setInventory: (inventory: Record<string, number>) => void;
  setEquippedTools: (equippedTools: string[]) => void;
  syncWallet: (data: {
    credits?: number;
    coins?: number;
    inventory?: Record<string, number>;
    equippedTools?: string[];
  }) => void;
  // Local optimistic helpers (kept for terminal flow compatibility)
  addCredits: (amount: number) => void;
  subtractCredits: (amount: number) => void;

  // Profile actions
  setCallsign: (callsign: string) => void;
  setProfileStats: (stats: Partial<{
    callsign: string;
    handle: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    breachesWon: number;
    breachesTotal: number;
    careerEarnings: number;
    avatarUrl: string;
  }>) => void;
  recordBreach: (won: boolean, earnings?: number, xpEarned?: number) => void;
  resetProfile: (callsign?: string, avatarUrl?: string) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  credits: 10000,
  coins: 25,
  inventory: {
    'tool-static-injector': 2,
    'tool-firewall-patch': 1,
  },
  equippedTools: ['tool-static-injector'],
  handle: 'ZERO_COOL',
  callsign: 'ZERO_COOL',
  avatarUrl: '/Character portraits/Player avatars.png',
  sectorHeat: 62, // 62%
  nixDismissed: false,

  // Profile stats: fresh profiles start at LVL 1, 0 / 0 breaches, $0 career earnings
  level: 1,
  xp: 0,
  nextLevelXp: 1000,
  breachesWon: 0,
  breachesTotal: 0,
  careerEarnings: 0,

  dismissNix: () => set({ nixDismissed: true }),
  setBalances: (credits, coins) => set({ credits, coins }),
  setInventory: (inventory) => set({ inventory }),
  setEquippedTools: (equippedTools) => set({ equippedTools }),
  syncWallet: (data) =>
    set((state) => ({
      credits: data.credits ?? state.credits,
      coins: data.coins ?? state.coins,
      inventory: data.inventory ?? state.inventory,
      equippedTools: data.equippedTools ?? state.equippedTools,
    })),

  addCredits: (amount: number) => set((state) => ({ credits: state.credits + amount })),
  subtractCredits: (amount: number) => set((state) => ({ credits: Math.max(0, state.credits - amount) })),

  setCallsign: (callsign: string) => set({ callsign, handle: callsign }),
  setProfileStats: (stats) =>
    set((state) => ({
      callsign: stats.callsign ?? stats.handle ?? state.callsign,
      handle: stats.handle ?? stats.callsign ?? state.handle,
      level: stats.level ?? state.level,
      xp: stats.xp ?? state.xp,
      nextLevelXp: stats.nextLevelXp ?? state.nextLevelXp,
      breachesWon: stats.breachesWon ?? state.breachesWon,
      breachesTotal: stats.breachesTotal ?? state.breachesTotal,
      careerEarnings: stats.careerEarnings ?? state.careerEarnings,
      avatarUrl: stats.avatarUrl ?? state.avatarUrl,
    })),

  recordBreach: (won: boolean, earnings = 0, xpEarned = won ? 150 : 25) =>
    set((state) => {
      const breachesWon = won ? state.breachesWon + 1 : state.breachesWon;
      const breachesTotal = state.breachesTotal + 1;
      const careerEarnings = won ? state.careerEarnings + earnings : state.careerEarnings;
      let xp = state.xp + xpEarned;
      let level = state.level;
      let nextLevelXp = state.nextLevelXp;
      while (xp >= nextLevelXp) {
        xp -= nextLevelXp;
        level += 1;
        nextLevelXp = level * 1000;
      }
      return {
        breachesWon,
        breachesTotal,
        careerEarnings,
        xp,
        level,
        nextLevelXp,
      };
    }),

  resetProfile: (callsign = 'ZERO_COOL', avatarUrl = '/Character portraits/Player avatars.png') =>
    set({
      handle: callsign,
      callsign,
      avatarUrl,
      level: 1,
      xp: 0,
      nextLevelXp: 1000,
      breachesWon: 0,
      breachesTotal: 0,
      careerEarnings: 0,
    }),
}));
