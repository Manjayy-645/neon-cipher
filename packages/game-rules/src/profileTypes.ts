export interface DeckerProfile {
  handle: string;
  avatarUrl: string;
  rank: {
    title: string;
    level: number;
    currentXp: number;
    nextLevelXp: number;
  };
  stats: {
    totalHacks: number;
    successfulBreaches: number;
    failedBreaches: number;
    winRatePercent: number; // computed
    currentStreak: number;
    bestStreak: number;
    totalCreditsEarned: number;
    fastestBreachSeconds: number;
    fewestGuesses: number;
  };
  cosmetics: {
    activeBadge: string;
    activeTerminalTheme: string;
    activeDeckFrame: string;
    unlockedBadges: string[];
    unlockedThemes: string[];
    unlockedFrames: string[];
  };
}

export interface SkillNode {
  id: string;
  name: string;
  branch: 'analysis' | 'stealth' | 'social';
  description: string;
  tier: number;
  pointCost: number;
  prerequisites: string[]; // IDs of required skills
  unlocked: boolean;
  effectKey: string;
  effectSummary: string;
}

export interface FactionStanding {
  id: string;
  name: string;
  motto: string;
  description: string;
  reputation: number; // -100 to +100
  standingLevel: 'Hostile' | 'Neutral' | 'Favored' | 'Allied';
  perks: string[];
  exclusiveContracts: {
    id: string;
    title: string;
    targetNode: string;
    bounty: number;
    reputationReward: number;
    repPenaltyOpponents: number;
    opposingFactionId: string;
    description: string;
  }[];
  opposingFactionId: string; // mutual exclusion target
}

export interface DailyBreachLeaderboardEntry {
  rank: number;
  handle: string;
  avatarUrl: string;
  guessesCount: number;
  timeSeconds: number;
  completedAt: string;
  rewardTier: string;
}

export interface DailyBreachData {
  date: string; // YYYY-MM-DD
  seed: string;
  nodeName: string;
  tier: number;
  digits: number;
  allowDuplicates: boolean;
  maxAttempts: number;
  timeLimitSeconds: number;
  bounty: number;
  userCompleted: boolean;
  userResult?: {
    guessesCount: number;
    timeSeconds: number;
    rank: number;
  };
  leaderboard: DailyBreachLeaderboardEntry[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'mastery' | 'streak' | 'syndicate' | 'special';
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  rewardCoins: number;
}

export interface GuessReplayStep {
  step: number;
  guess: string;
  pots: number;
  pans: number;
  timeElapsedSeconds: number;
  note?: string;
}

export interface BreachReplay {
  id: string;
  nodeName: string;
  date: string;
  won: boolean;
  targetDigits: number;
  guesses: GuessReplayStep[];
  secretCodeRevealed: string;
}

export interface FriendProfile {
  id: string;
  handle: string;
  avatarUrl: string;
  status: 'online' | 'in-breach' | 'offline';
  rankTitle: string;
  bestStreak: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'contract' | 'faction' | 'achievement';
  timestamp: number;
  read: boolean;
}
