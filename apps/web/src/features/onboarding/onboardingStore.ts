import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StepId, STEP_ORDER, STEPS } from './steps';
import { PLAYER_AVATARS } from '@neon-cipher/game-rules/src/characters';

const AVATAR_IDS = ['avatar-nx', 'avatar-gl', 'avatar-zk', 'avatar-ph', 'avatar-cy', 'avatar-op'] as const;

export const ONBOARDING_AVATARS = PLAYER_AVATARS.map((avatar, index) => ({
  ...avatar,
  id: AVATAR_IDS[index],
}));

export interface CrackedNodeRecord {
  crackedAt: number;
  cooldownMs: number;
}

export interface OnboardingState {
  step: StepId;
  skipped: boolean;
  skipExplanations: boolean;
  guestId: string;
  callsign: string | null;
  avatarId: string | null;
  seen: Record<string, true>;
  wins: number;
  ch2Fails: number;
  accountSaved: boolean;
  startedAt: number | null;
  crackedNodes: Record<string, CrackedNodeRecord>;

  // Actions
  advance: (to?: StepId) => void;
  skip: () => void;
  markSeen: (key: string) => void;
  setProfile: (callsign: string, avatarId: string) => void;
  recordWin: () => void;
  recordCh2Fail: () => void;
  crackNode: (id: string, cooldownMs: number) => void;
  saveAccount: () => void;
  reset: () => void;

  // Selectors
  chromeVisible: () => boolean;
}

function generateGuestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'guest_' + Math.random().toString(36).substring(2, 15);
}

export function isChromeVisible(
  step: StepId,
  skipped: boolean,
  hasProfile: boolean
): boolean {
  if (skipped && hasProfile) return true;
  return STEPS[step]?.chrome ?? false;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 'splash',
      skipped: false,
      skipExplanations: false,
      guestId: generateGuestId(),
      callsign: null,
      avatarId: null,
      seen: {},
      wins: 0,
      ch2Fails: 0,
      accountSaved: false,
      startedAt: null,
      crackedNodes: {},

      advance: (to?: StepId) => {
        set((state) => {
          const currentIndex = STEP_ORDER.indexOf(state.step);
          if (to) {
            const targetIndex = STEP_ORDER.indexOf(to);
            if (targetIndex < currentIndex) {
              return state; // ignore if to is earlier than current
            }
            return {
              step: to,
              startedAt: state.startedAt ?? Date.now(),
            };
          }
          const nextIndex = Math.min(STEP_ORDER.length - 1, currentIndex + 1);
          return {
            step: STEP_ORDER[nextIndex],
            startedAt: state.startedAt ?? Date.now(),
          };
        });
      },

      skip: () => {
        set({ skipped: true, step: 'done' });
      },

      markSeen: (key: string) => {
        set((state) => ({
          seen: { ...state.seen, [key]: true },
        }));
      },

      setProfile: (callsign: string, avatarId: string) => {
        set({ callsign, avatarId });
      },

      recordWin: () => {
        set((state) => ({ wins: state.wins + 1 }));
      },

      recordCh2Fail: () => {
        set((state) => ({ ch2Fails: state.ch2Fails + 1 }));
      },

      crackNode: (id: string, cooldownMs: number) => {
        set((state) => ({
          crackedNodes: {
            ...state.crackedNodes,
            [id]: { crackedAt: Date.now(), cooldownMs },
          },
        }));
      },

      saveAccount: () => {
        set({ accountSaved: true });
      },

      reset: () => {
        set({
          step: 'splash',
          skipped: false,
          skipExplanations: false,
          guestId: generateGuestId(),
          callsign: null,
          avatarId: null,
          seen: {},
          wins: 0,
          ch2Fails: 0,
          accountSaved: false,
          startedAt: null,
          crackedNodes: {},
        });
      },

      chromeVisible: () => {
        const { step, skipped, callsign } = get();
        return isChromeVisible(step, skipped, Boolean(callsign));
      },
    }),
    {
      name: 'nc.onboarding.v1',
    }
  )
);
