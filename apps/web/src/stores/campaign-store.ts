import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CampaignState, ChapterProgress } from '@/app/api/mock/db';
import { defaultCampaignState } from '@/app/api/mock/db';
import { campaignService } from '@/features/story/campaignService';

interface CampaignStoreState {
  debt: {
    initial: number;
    current: number;
    paid: number;
  };
  chapters: Record<string, ChapterProgress>;
  activeChapterId: string | null;
  unlocks: {
    blackMarket: boolean;
    onlinePlay: boolean;
    bridge: boolean;
  };
  tutorials: Record<string, {
    completed: boolean;
    skipped: boolean;
  }>;
  isLoading: boolean;
  tutorialActive: boolean;
  tutorialStepIndex: number;

  // Actions
  syncCampaign: (state: CampaignState) => void;
  loadCampaign: () => Promise<void>;
  acceptChapter: (chapterId: string) => Promise<void>;
  completeChapter: (chapterId: string) => Promise<void>;
  setTutorialActive: (active: boolean) => void;
  setTutorialStepIndex: (step: number) => void;
  nextTutorialStep: () => void;
  skipTutorial: (chapterId: string) => Promise<void>;
  completeTutorial: (chapterId: string) => Promise<void>;
  resetCampaign: (targetChapterId?: string) => Promise<void>;
}

export const useCampaignStore = create<CampaignStoreState>()(
  persist(
    (set, get) => ({
      debt: { ...defaultCampaignState.debt },
      chapters: { ...defaultCampaignState.chapters },
      activeChapterId: defaultCampaignState.activeChapterId,
      unlocks: { ...defaultCampaignState.unlocks },
      tutorials: { ...defaultCampaignState.tutorials },
      isLoading: false,
      tutorialActive: false,
      tutorialStepIndex: 0,

  syncCampaign: (state) =>
    set({
      debt: state.debt,
      chapters: state.chapters,
      activeChapterId: state.activeChapterId,
      unlocks: state.unlocks,
      tutorials: state.tutorials,
    }),

  loadCampaign: async () => {
    try {
      set({ isLoading: true });
      const state = await campaignService.getCampaign();
      get().syncCampaign(state);
    } catch (e) {
      console.error('Failed to load campaign from mock server:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  acceptChapter: async (chapterId) => {
    try {
      const state = await campaignService.acceptChapter(chapterId);
      get().syncCampaign(state);
      set({ tutorialActive: true, tutorialStepIndex: 0 });
    } catch (e) {
      console.error('Failed to accept chapter:', e);
    }
  },

  completeChapter: async (chapterId) => {
    try {
      const res = await campaignService.completeChapter(chapterId);
      get().syncCampaign(res.state);
      set({ tutorialActive: false });
    } catch (e) {
      console.error('Failed to complete chapter:', e);
    }
  },

  setTutorialActive: (active) => set({ tutorialActive: active }),
  setTutorialStepIndex: (step) => set({ tutorialStepIndex: step }),
  nextTutorialStep: () => set((state) => ({ tutorialStepIndex: state.tutorialStepIndex + 1 })),

  skipTutorial: async (chapterId) => {
    set({ tutorialActive: false });
    try {
      const state = await campaignService.updateTutorial(chapterId, { skipped: true });
      get().syncCampaign(state);
    } catch (e) {
      console.error('Failed to skip tutorial on server:', e);
    }
  },

  completeTutorial: async (chapterId) => {
    set({ tutorialActive: false });
    try {
      const state = await campaignService.updateTutorial(chapterId, { completed: true });
      get().syncCampaign(state);
    } catch (e) {
      console.error('Failed to complete tutorial on server:', e);
    }
  },

  resetCampaign: async () => {
    try {
      const state = await campaignService.resetCampaign();
      get().syncCampaign(state);
    } catch (e) {
      console.error('Failed to reset campaign on server:', e);
    }
  },
    }),
    {
      name: 'nc_campaign_store',
      partialize: (state) => ({
        debt: state.debt,
        chapters: state.chapters,
        activeChapterId: state.activeChapterId,
        unlocks: state.unlocks,
        tutorials: state.tutorials,
      }),
    }
  )
);
