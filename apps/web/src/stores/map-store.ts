import { create } from 'zustand';
import { usePlayerStore } from './player-store';
import { useCampaignStore } from './campaign-store';

export type SheetState = 'peek' | 'half' | 'expanded';
export type NavTab = 'map' | 'rig' | 'market' | 'comms' | 'duel';

export interface PlayerStats {
  credits: number;
  heat: number;
}

export interface Unlocks {
  bridge: boolean;
}

export const SNAP_HEIGHTS: Record<SheetState, number> = {
  peek: 76,
  half: 250,
  expanded: 500,
};

export type MapView = 'overview' | 'district' | 'node';
export type DistrictId = 'slums' | 'commercial';

export interface MapState {
  // 1. State & Selection
  view: MapView;
  selectedDistrict: DistrictId | null;
  activeNodeId: string | null;
  selectedNodeId: string | null;
  sheetState: SheetState;
  sheetHeight: number;
  playerStats: PlayerStats;
  seenNixSituations: string[];
  activeNixSituation: string | null;
  isNixBubbleOpen: boolean;

  // Navigation tab state
  activeTab: NavTab;
  activeView: NavTab;

  unlocks: Unlocks;
  timeOfDay: 'day' | 'dusk' | 'night';
  ambientOverride: 'auto' | 'enabled' | 'disabled';

  // Actions
  setView: (view: MapView) => void;
  setSelectedDistrict: (district: DistrictId | null) => void;
  selectDistrict: (district: DistrictId) => void;
  stepBackView: () => void;
  setActiveNodeId: (id: string | null) => void;
  selectNode: (id: string | null) => void;
  setSheetState: (state: SheetState) => void;
  setSheetHeight: (height: number) => void;
  setPlayerStats: (stats: Partial<PlayerStats>) => void;
  setActiveTab: (tab: NavTab) => void;
  setActiveView: (view: NavTab) => void;
  setBridgeUnlocked: (unlocked: boolean) => void;
  setTimeOfDay: (timeOfDay: 'day' | 'dusk' | 'night') => void;
  setAmbientOverride: (ambientOverride: 'auto' | 'enabled' | 'disabled') => void;
  triggerNixSituation: (situation: string) => void;
  markNixSituationSeen: (situation: string) => void;
  setNixBubbleOpen: (open: boolean) => void;
  devFlagTick: number;
  bumpDevFlagTick: () => void;
  resetMapState: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  view: 'overview',
  selectedDistrict: null,
  activeNodeId: null,
  selectedNodeId: null,
  sheetState: 'peek',
  sheetHeight: SNAP_HEIGHTS.peek,
  playerStats: {
    credits: typeof usePlayerStore !== 'undefined' ? usePlayerStore.getState()?.credits ?? 10000 : 10000,
    heat: typeof usePlayerStore !== 'undefined' ? usePlayerStore.getState()?.sectorHeat ?? 62 : 62,
  },
  seenNixSituations: [],
  activeNixSituation: null,
  isNixBubbleOpen: false,
  activeTab: 'map',
  activeView: 'map',
  unlocks: {
    bridge: typeof useCampaignStore !== 'undefined' ? Boolean(useCampaignStore.getState()?.unlocks?.bridge) : false,
  },
  timeOfDay: 'day',
  ambientOverride: 'auto',
  devFlagTick: 0,
  bumpDevFlagTick: () => set((s) => ({ devFlagTick: s.devFlagTick + 1 })),

  setView: (view) => set({ view }),

  setSelectedDistrict: (selectedDistrict) => set({ selectedDistrict }),

  selectDistrict: (district) =>
    set({
      view: 'district',
      selectedDistrict: district,
      activeNodeId: null,
      selectedNodeId: null,
      sheetState: 'peek',
      sheetHeight: SNAP_HEIGHTS.peek,
    }),

  stepBackView: () =>
    set((state) => {
      if (state.view === 'node') {
        return {
          view: 'district',
          activeNodeId: null,
          selectedNodeId: null,
          sheetState: 'peek',
          sheetHeight: SNAP_HEIGHTS.peek,
        };
      }
      if (state.view === 'district') {
        return {
          view: 'overview',
          selectedDistrict: null,
          activeNodeId: null,
          selectedNodeId: null,
          sheetState: 'peek',
          sheetHeight: SNAP_HEIGHTS.peek,
        };
      }
      return {};
    }),

  setActiveNodeId: (id) =>
    set((state) => ({
      activeNodeId: id,
      selectedNodeId: id,
      view: id ? 'node' : state.selectedDistrict ? 'district' : 'overview',
      selectedDistrict: id
        ? id.startsWith('c')
          ? 'commercial'
          : 'slums'
        : state.selectedDistrict,
      sheetState: id ? 'half' : 'peek',
      sheetHeight: id ? SNAP_HEIGHTS.half : SNAP_HEIGHTS.peek,
    })),

  selectNode: (id) =>
    set((state) => ({
      activeNodeId: id,
      selectedNodeId: id,
      view: id ? 'node' : state.selectedDistrict ? 'district' : 'overview',
      selectedDistrict: id
        ? id.startsWith('c')
          ? 'commercial'
          : 'slums'
        : state.selectedDistrict,
      sheetState: id ? 'half' : 'peek',
      sheetHeight: id ? SNAP_HEIGHTS.half : SNAP_HEIGHTS.peek,
    })),

  setSheetState: (sheetState) =>
    set({
      sheetState,
      sheetHeight: SNAP_HEIGHTS[sheetState],
    }),

  setSheetHeight: (sheetHeight) =>
    set(() => {
      let sheetState: SheetState = 'half';
      if (sheetHeight <= 100) sheetState = 'peek';
      else if (sheetHeight >= 350) sheetState = 'expanded';
      return { sheetHeight, sheetState };
    }),

  setPlayerStats: (stats) =>
    set((state) => {
      const nextStats = { ...state.playerStats, ...stats };
      if (stats.credits !== undefined && typeof usePlayerStore !== 'undefined') {
        usePlayerStore.setState({ credits: stats.credits });
      }
      if (stats.heat !== undefined && typeof usePlayerStore !== 'undefined') {
        usePlayerStore.setState({ sectorHeat: stats.heat });
      }
      return { playerStats: nextStats };
    }),

  setActiveTab: (tab) => set({ activeTab: tab, activeView: tab }),
  setActiveView: (view) => set({ activeView: view, activeTab: view }),

  setBridgeUnlocked: (unlocked) =>
    set((state) => ({ unlocks: { ...state.unlocks, bridge: unlocked } })),

  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setAmbientOverride: (ambientOverride) => set({ ambientOverride }),

  triggerNixSituation: (situation) =>
    set({ activeNixSituation: situation, isNixBubbleOpen: true }),

  markNixSituationSeen: (situation) =>
    set((state) =>
      state.seenNixSituations.includes(situation)
        ? state
        : { seenNixSituations: [...state.seenNixSituations, situation] }
    ),

  setNixBubbleOpen: (isNixBubbleOpen) => set({ isNixBubbleOpen }),

  resetMapState: () =>
    set({
      view: 'overview',
      selectedDistrict: null,
      activeNodeId: null,
      selectedNodeId: null,
      sheetState: 'peek',
      sheetHeight: SNAP_HEIGHTS.peek,
      activeTab: 'map',
      activeView: 'map',
      playerStats: {
        credits: typeof usePlayerStore !== 'undefined' ? usePlayerStore.getState()?.credits ?? 10000 : 10000,
        heat: typeof usePlayerStore !== 'undefined' ? usePlayerStore.getState()?.sectorHeat ?? 62 : 62,
      },
      seenNixSituations: [],
      activeNixSituation: null,
      isNixBubbleOpen: false,
      unlocks: { bridge: false },
      timeOfDay: 'day',
      ambientOverride: 'auto',
    }),
}));

// Sync changes from campaign store unlocks back into mapStore bridge unlock
if (typeof useCampaignStore !== 'undefined' && useCampaignStore.subscribe) {
  useCampaignStore.subscribe((campaignState) => {
    const isBridgeUnlocked = Boolean(campaignState.unlocks?.bridge);
    const currentBridge = useMapStore.getState()?.unlocks?.bridge;
    if (currentBridge !== isBridgeUnlocked) {
      useMapStore.setState((s) => ({
        unlocks: { ...s.unlocks, bridge: isBridgeUnlocked },
      }));
    }
  });
}

// Sync changes from player store back into mapStore playerStats
if (typeof usePlayerStore !== 'undefined' && usePlayerStore.subscribe) {
  usePlayerStore.subscribe((playerState) => {
    const current = useMapStore.getState()?.playerStats;
    if (
      current &&
      (current.credits !== playerState.credits || current.heat !== playerState.sectorHeat)
    ) {
      useMapStore.setState({
        playerStats: {
          credits: playerState.credits,
          heat: playerState.sectorHeat,
        },
      });
    }
  });
}
