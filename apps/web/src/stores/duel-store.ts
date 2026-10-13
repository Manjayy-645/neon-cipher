import { create } from 'zustand';
import { DuelRoom, DuelSession, DuelMatchType, DuelGuess } from '@/features/duel/types';
import { duelService } from '@/features/duel/duelService';
import { usePlayerStore } from './player-store';

interface DuelState {
  rooms: DuelRoom[];
  activeSession: DuelSession | null;
  activeMobileTab: 'player' | 'rival';
  selectedMatchType: DuelMatchType;
  wager: number;
  isLoading: boolean;
  error: string | null;
  sabotageFeedback: {
    message: string;
    type: 'success' | 'shielded' | 'error';
  } | null;

  // Actions
  fetchRooms: () => Promise<void>;
  createRoom: (name: string) => Promise<void>;
  startQuickDuel: (customWager?: number) => Promise<void>;
  joinRoom: (room: DuelRoom) => Promise<void>;
  submitGuess: (guess: string, exploitUsed?: string) => Promise<{ playerGuess: DuelGuess; rivalGuess?: DuelGuess }>;
  useSabotage: (toolId: string) => Promise<void>;
  doubleOrNothing: () => Promise<void>;
  exitDuel: () => void;
  setMobileTab: (tab: 'player' | 'rival') => void;
  setWager: (wager: number) => void;
  setMatchType: (type: DuelMatchType) => void;
  clearSabotageFeedback: () => void;
}

export const useDuelStore = create<DuelState>((set, get) => ({
  rooms: [],
  activeSession: null,
  activeMobileTab: 'player',
  selectedMatchType: 'casual',
  wager: 0,
  isLoading: false,
  error: null,
  sabotageFeedback: null,

  fetchRooms: async () => {
    try {
      set({ isLoading: true, error: null });
      const rooms = await duelService.getRooms();
      set({ rooms, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch rooms';
      set({ error: msg, isLoading: false });
    }
  },

  createRoom: async (name: string) => {
    try {
      set({ isLoading: true, error: null });
      const { selectedMatchType, wager } = get();
      const playerHandle = usePlayerStore.getState().handle;
      const newRoom = await duelService.createRoom({
        name,
        matchType: selectedMatchType,
        wager,
        host: playerHandle,
      });
      set((state) => ({ rooms: [newRoom, ...state.rooms], isLoading: false }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  startQuickDuel: async (customWager?: number) => {
    try {
      set({ isLoading: true, error: null });
      const { selectedMatchType, wager } = get();
      const actualWager = customWager !== undefined ? customWager : wager;
      const playerHandle = usePlayerStore.getState().handle;
      const session = await duelService.startDuel({
        matchType: selectedMatchType,
        wager: actualWager,
        playerHandle,
      });

      // Deduct entry fee locally in player store cache
      const ante = session.ante || 0;
      const totalCost = actualWager + ante;
      if (totalCost > 0) {
        usePlayerStore.getState().subtractCredits(totalCost);
      }

      set({ activeSession: session, activeMobileTab: 'player', isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start duel';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  joinRoom: async (room: DuelRoom) => {
    try {
      set({ isLoading: true, error: null });
      const playerHandle = usePlayerStore.getState().handle;
      const session = await duelService.startDuel({
        matchType: room.matchType,
        wager: room.wager,
        ante: room.ante,
        roomId: room.id,
        playerHandle,
      });

      const totalCost = room.wager + room.ante;
      if (totalCost > 0) {
        usePlayerStore.getState().subtractCredits(totalCost);
      }

      set({ activeSession: session, activeMobileTab: 'player', isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join room';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  submitGuess: async (guess: string, exploitUsed?: string) => {
    const { activeSession } = get();
    if (!activeSession) throw new Error('No active duel session');

    try {
      set({ isLoading: true, error: null });
      const result = await duelService.submitGuess(activeSession.id, guess, exploitUsed);

      // If victory, credit net pot to player store cache
      if (result.session.status === 'player_won' && result.session.netPot > 0) {
        usePlayerStore.getState().addCredits(result.session.netPot);
      }

      set({ activeSession: result.session, isLoading: false });
      return { playerGuess: result.playerGuess, rivalGuess: result.rivalGuess };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit guess';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  useSabotage: async (toolId: string) => {
    const { activeSession } = get();
    if (!activeSession) throw new Error('No active duel session');

    try {
      const result = await duelService.useSabotage(activeSession.id, toolId);

      // Update player credits in wallet cache
      usePlayerStore.getState().setBalances(result.remainingCredits, usePlayerStore.getState().coins);

      // Refresh session state to show updated effects
      const res = await fetch(`/api/mock/duel/session?duelId=${activeSession.id}`);
      if (res.ok) {
        const data = await res.json();
        set({ activeSession: data.session });
      }

      set({
        sabotageFeedback: {
          message: result.message,
          type: result.shielded ? 'shielded' : 'success',
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sabotage activation failed';
      set({
        sabotageFeedback: {
          message: msg,
          type: 'error',
        },
      });
      throw err;
    }
  },

  doubleOrNothing: async () => {
    const { activeSession } = get();
    if (!activeSession) throw new Error('No active duel session');

    try {
      set({ isLoading: true, error: null });
      const newSession = await duelService.triggerDoubleOrNothing(activeSession.id);
      set({ activeSession: newSession, activeMobileTab: 'player', isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to double or nothing';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  exitDuel: () => {
    set({ activeSession: null, error: null, sabotageFeedback: null });
    get().fetchRooms();
  },

  setMobileTab: (tab) => set({ activeMobileTab: tab }),
  setWager: (wager) => set({ wager }),
  setMatchType: (type) => set({
    selectedMatchType: type,
    wager: type === 'casual' ? 0 : get().wager || 250,
  }),
  clearSabotageFeedback: () => set({ sabotageFeedback: null }),
}));
