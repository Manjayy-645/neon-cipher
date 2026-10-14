export type ReducedMotionMode = 'system' | 'reduced' | 'full';

export interface AudioSettings {
  keystrokes: number; // 0 to 100
  ui: number;         // 0 to 100
  ambient: number;    // 0 to 100
}

export interface AccountSettings {
  rookieAssist: boolean; // true = rookie assist, false = pro mode
  reducedMotion: ReducedMotionMode;
  colorBlindMode: boolean; // true = shape-only clues
  audio: AudioSettings;
  dailySpendLimit: number | null; // null = unlimited, otherwise max credits/coins
  seenFeatureGuides?: string[];
}

export interface AccountProfile {
  id: string;
  handle: string;
  avatarUrl: string;
  createdAt: number;
}
