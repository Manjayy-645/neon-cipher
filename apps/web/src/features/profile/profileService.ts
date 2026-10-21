// MOCK: replace with Supabase client calls.
import {
  DeckerProfile,
  SkillNode,
  FactionStanding,
  DailyBreachData,
  Achievement,
  BreachReplay,
  FriendProfile,
  AppNotification,
} from '@neon-cipher/game-rules';
import { usePlayerStore } from '@/stores/player-store';

export interface ProfileAllData {
  profile: DeckerProfile;
  skillTree: { skills: SkillNode[]; availablePoints: number };
  factions: FactionStanding[];
  dailyBreach: DailyBreachData;
  achievements: Achievement[];
  replays: BreachReplay[];
  friends: FriendProfile[];
  notifications: AppNotification[];
}

export const profileService = {
  getAll: async (): Promise<ProfileAllData> => {
    const player = usePlayerStore.getState();
    const handle = player.callsign || player.handle;
    const url = handle ? `/api/mock/profile?handle=${encodeURIComponent(handle)}` : '/api/mock/profile';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch profile and progression data');
    const data: ProfileAllData = await res.json();

    // Synchronize with active player state from player-store.ts
    if (data?.profile) {
      const p = usePlayerStore.getState();
      const activeCallsign = p.callsign || p.handle;
      const isHardcodedMock = data.profile.handle === 'ZERO_COOL' && data.profile.rank?.level === 7 && data.profile.stats?.totalCreditsEarned === 38400;
      if (activeCallsign && (activeCallsign !== 'ZERO_COOL' || isHardcodedMock || p.breachesTotal > 0)) {
        data.profile.handle = activeCallsign;
        data.profile.avatarUrl = p.avatarUrl || data.profile.avatarUrl;
        data.profile.rank.level = p.level;
        data.profile.rank.currentXp = p.xp;
        data.profile.rank.nextLevelXp = p.nextLevelXp;
        data.profile.stats.successfulBreaches = p.breachesWon;
        data.profile.stats.totalHacks = p.breachesTotal;
        data.profile.stats.failedBreaches = Math.max(0, p.breachesTotal - p.breachesWon);
        data.profile.stats.winRatePercent = p.breachesTotal > 0
          ? Math.round((p.breachesWon / p.breachesTotal) * 100)
          : 0;
        data.profile.stats.totalCreditsEarned = p.careerEarnings;
      }
    }
    return data;
  },

  getProfile: async (): Promise<DeckerProfile> => {
    const player = usePlayerStore.getState();
    const handle = player.callsign || player.handle;
    const url = handle
      ? `/api/mock/profile?section=profile&handle=${encodeURIComponent(handle)}`
      : '/api/mock/profile?section=profile';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch profile');
    const data = await res.json();
    const prof: DeckerProfile = data.profile;

    if (prof) {
      const p = usePlayerStore.getState();
      const activeCallsign = p.callsign || p.handle;
      const isHardcodedMock = prof.handle === 'ZERO_COOL' && prof.rank?.level === 7 && prof.stats?.totalCreditsEarned === 38400;
      if (activeCallsign && (activeCallsign !== 'ZERO_COOL' || isHardcodedMock || p.breachesTotal > 0)) {
        prof.handle = activeCallsign;
        prof.avatarUrl = p.avatarUrl || prof.avatarUrl;
        prof.rank.level = p.level;
        prof.rank.currentXp = p.xp;
        prof.rank.nextLevelXp = p.nextLevelXp;
        prof.stats.successfulBreaches = p.breachesWon;
        prof.stats.totalHacks = p.breachesTotal;
        prof.stats.failedBreaches = Math.max(0, p.breachesTotal - p.breachesWon);
        prof.stats.winRatePercent = p.breachesTotal > 0
          ? Math.round((p.breachesWon / p.breachesTotal) * 100)
          : 0;
        prof.stats.totalCreditsEarned = p.careerEarnings;
      }
    }
    return prof;
  },

  updateCosmetics: async (cosmetics: Partial<DeckerProfile['cosmetics']>): Promise<DeckerProfile> => {
    const res = await fetch('/api/mock/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-cosmetics', cosmetics }),
    });
    if (!res.ok) throw new Error('Failed to update cosmetics');
    const data = await res.json();
    return data.profile;
  },

  getSkillTree: async (): Promise<{ skills: SkillNode[]; availablePoints: number }> => {
    const res = await fetch('/api/mock/profile?section=skills');
    if (!res.ok) throw new Error('Failed to fetch skill tree');
    return res.json();
  },

  unlockSkill: async (skillId: string): Promise<{ success: boolean; skill: SkillNode; remainingPoints: number }> => {
    const res = await fetch('/api/mock/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlock-skill', skillId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to unlock skill');
    }
    return res.json();
  },

  respecSkills: async (): Promise<{ success: boolean; skills: SkillNode[]; availablePoints: number }> => {
    const res = await fetch('/api/mock/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'respec-skills' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to respec skill tree');
    }
    return res.json();
  },

  getFactions: async (): Promise<FactionStanding[]> => {
    const res = await fetch('/api/mock/profile?section=factions');
    if (!res.ok) throw new Error('Failed to fetch factions');
    const data = await res.json();
    return data.factions;
  },

  acceptContract: async (contractId: string): Promise<{ success: boolean; contractTitle: string; message: string; warning?: string }> => {
    const res = await fetch('/api/mock/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept-contract', contractId }),
    });
    if (!res.ok) throw new Error('Failed to accept faction contract');
    return res.json();
  },

  getDailyBreach: async (): Promise<DailyBreachData> => {
    const res = await fetch('/api/mock/profile?section=daily-breach');
    if (!res.ok) throw new Error('Failed to fetch daily breach');
    const data = await res.json();
    return data.dailyBreach;
  },

  submitDailyBreach: async (guessesCount: number, timeSeconds: number): Promise<DailyBreachData> => {
    const res = await fetch('/api/mock/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit-daily', guessesCount, timeSeconds }),
    });
    if (!res.ok) throw new Error('Failed to submit daily breach attempt');
    const data = await res.json();
    return data.dailyBreach;
  },

  getAchievements: async (): Promise<Achievement[]> => {
    const res = await fetch('/api/mock/profile?section=achievements');
    if (!res.ok) throw new Error('Failed to fetch achievements');
    const data = await res.json();
    return data.achievements;
  },

  getReplays: async (): Promise<BreachReplay[]> => {
    const res = await fetch('/api/mock/profile?section=replays');
    if (!res.ok) throw new Error('Failed to fetch replays');
    const data = await res.json();
    return data.replays;
  },

  getFriends: async (): Promise<FriendProfile[]> => {
    const res = await fetch('/api/mock/profile?section=friends');
    if (!res.ok) throw new Error('Failed to fetch friends');
    const data = await res.json();
    return data.friends;
  },

  getNotifications: async (): Promise<AppNotification[]> => {
    const res = await fetch('/api/mock/profile?section=notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const data = await res.json();
    return data.notifications;
  },

  markNotificationRead: async (notificationId: string): Promise<AppNotification[]> => {
    const res = await fetch('/api/mock/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-notification-read', notificationId }),
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    const data = await res.json();
    return data.notifications;
  },
};
