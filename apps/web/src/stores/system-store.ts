import { create } from 'zustand';

interface SystemState {
  // Network connection
  isOnline: boolean;
  simulatedOffline: boolean;
  reconnectBannerVisible: boolean;
  isReconnecting: boolean;
  
  // Mid-duel desync state
  midDuelDesync: boolean;
  midDuelSecondsLeft: number;

  // System loading overlay
  globalLoading: boolean;
  loadingMessage: string;

  // Offline notice modal
  offlineNoticeVisible: boolean;

  // Actions
  setOnline: (online: boolean) => void;
  setSimulatedOffline: (offline: boolean) => void;
  triggerReconnectedBanner: () => void;
  dismissReconnectBanner: () => void;
  setReconnecting: (reconnecting: boolean) => void;
  setMidDuelDesync: (active: boolean, initialSeconds?: number) => void;
  decrementDuelTimer: () => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setOfflineNoticeVisible: (visible: boolean) => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  isOnline: true,
  simulatedOffline: false,
  reconnectBannerVisible: false,
  isReconnecting: false,

  midDuelDesync: false,
  midDuelSecondsLeft: 30,

  globalLoading: false,
  loadingMessage: 'INITIALIZING SUB-GRID LINK...',

  offlineNoticeVisible: false,

  setOnline: (online: boolean) => {
    const wasOffline = !get().isOnline || get().simulatedOffline;
    set({ isOnline: online, isReconnecting: false });
    if (wasOffline && online && !get().simulatedOffline) {
      get().triggerReconnectedBanner();
    }
  },

  setSimulatedOffline: (simulated: boolean) => {
    const prevOffline = !get().isOnline || get().simulatedOffline;
    set({ simulatedOffline: simulated, isReconnecting: false });
    if (prevOffline && !simulated && get().isOnline) {
      get().triggerReconnectedBanner();
    }
  },

  triggerReconnectedBanner: () => {
    set({ reconnectBannerVisible: true, isReconnecting: false });
    setTimeout(() => {
      set({ reconnectBannerVisible: false });
    }, 3500);
  },

  dismissReconnectBanner: () => set({ reconnectBannerVisible: false }),

  setReconnecting: (isReconnecting: boolean) => set({ isReconnecting }),

  setMidDuelDesync: (active: boolean, initialSeconds = 30) => {
    set({
      midDuelDesync: active,
      midDuelSecondsLeft: initialSeconds,
    });
  },

  decrementDuelTimer: () => {
    set((state) => ({
      midDuelSecondsLeft: Math.max(0, state.midDuelSecondsLeft - 1),
    }));
  },

  setGlobalLoading: (globalLoading: boolean, message = 'INITIALIZING SUB-GRID LINK...') => {
    set({ globalLoading, loadingMessage: message });
  },

  setOfflineNoticeVisible: (visible: boolean) => set({ offlineNoticeVisible: visible }),
}));
