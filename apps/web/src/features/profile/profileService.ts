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
    const res = await fetch('/api/mock/profile');
    if (!res.ok) throw new Error('Failed to fetch profile and progression data');
    return res.json();
  },

  getProfile: async (): Promise<DeckerProfile> => {
    const res = await fetch('/api/mock/profile?section=profile');
    if (!res.ok) throw new Error('Failed to fetch profile');
    const data = await res.json();
    return data.profile;
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
