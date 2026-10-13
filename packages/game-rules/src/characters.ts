export interface CharacterConfig {
  id: string;
  name: string;
  title: string;
  role: 'mentor' | 'broker' | 'tech' | 'rival';
  avatar: string;
  portrait: string;
  themeColor: string;
  bio: string;
  signatureLine: string;
}

export const CHARACTER_PORTRAITS = {
  nix: '/Character portraits/Nix.png',
  glitch: '/Character portraits/Glitch.png',
  alex: '/Character portraits/Alex.png',
  null_byte: '/Character portraits/Null_Byte.png',
} as const;

export interface PlayerAvatarOption {
  id: string;
  url: string;
  name: string;
}

export const PLAYER_AVATARS: PlayerAvatarOption[] = [
  { id: 'player-1', url: '/Character portraits/Player avatars.png', name: 'Cipher Ghost' },
  { id: 'player-2', url: '/Character portraits/Player avatars (2).png', name: 'Grid Runner' },
  { id: 'player-3', url: '/Character portraits/Player avatars (3).png', name: 'Neon Samurai' },
  { id: 'player-4', url: '/Character portraits/Player avatars (4).png', name: 'Subnet Phantom' },
  { id: 'player-5', url: '/Character portraits/Player avatars (5).png', name: 'Data Rogue' },
  { id: 'player-6', url: '/Character portraits/Player avatars (6).png', name: 'Cyberpunk Operative' },
];

/**
 * Single source of truth for character roles and definitions.
 * Nix is the tactical mentor who translates mechanics into plain everyday language.
 * Glitch is the underground broker managing loan contracts, bounties, and black market access.
 * Alex is the hardware specialist managing cyberdeck diagnostics and repairs at Alex's Tech.
 * Null_Byte is the syndicate's autonomous rival AI decker for competitive duel matches.
 */
export const CHARACTERS: Record<'nix' | 'glitch' | 'alex' | 'null_byte', CharacterConfig> = {
  nix: {
    id: 'nix',
    name: 'Nix',
    title: 'Veteran Street Decker',
    role: 'mentor',
    avatar: CHARACTER_PORTRAITS.nix,
    portrait: CHARACTER_PORTRAITS.nix,
    themeColor: 'accent',
    bio: 'Your street mentor. Explains Pot/Pan mechanics and terminal tricks in plain language.',
    signatureLine: 'Signal stable. Lock is local. Keep your fingers steady.',
  },
  glitch: {
    id: 'glitch',
    name: 'Glitch',
    title: 'Black Market Broker',
    role: 'broker',
    avatar: CHARACTER_PORTRAITS.glitch,
    portrait: CHARACTER_PORTRAITS.glitch,
    themeColor: 'money',
    bio: 'Underground broker and loan liaison. Dispatches syndicate bounties and tracks your debt balance.',
    signatureLine: 'Kovacs Syndicate expects their cut. Let us see what you can crack.',
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    title: 'Hardware Specialist',
    role: 'tech',
    avatar: CHARACTER_PORTRAITS.alex,
    portrait: CHARACTER_PORTRAITS.alex,
    themeColor: 'accent',
    bio: "Owner of Alex's Tech Corner Store. Expert in cyberdeck diagnostics, bus trace soldering, and overclocking.",
    signatureLine: 'If it burns, bring it to the bench. I will have your deck humming in no time.',
  },
  null_byte: {
    id: 'null_byte',
    name: 'Null_Byte',
    title: 'Rival Decker AI',
    role: 'rival',
    avatar: CHARACTER_PORTRAITS.null_byte,
    portrait: CHARACTER_PORTRAITS.null_byte,
    themeColor: 'danger',
    bio: 'Autonomous syndicate counter-intrusion daemon. Challenges deckers in competitive high-stakes terminal duels.',
    signatureLine: 'Analyzing subnet traffic... Breach attempt detected.',
  },
};

/**
 * CONFIGURATION FLAG FOR CHARACTER UNIFICATION (Item 5):
 * Resolves the open decision from docs/HANDOFF.md 3.6 & AGENTS.md.
 * If design decides to merge Nix and Glitch into one character, toggle
 * `singleCharacterMode: true` and specify which persona leads.
 */
export interface CharacterModeConfig {
  singleCharacterMode: boolean;
  activeMentor: 'nix' | 'glitch';
  activeBroker: 'nix' | 'glitch';
  unifiedPersonaName?: string;
}

export const CHARACTER_MODE: CharacterModeConfig = {
  singleCharacterMode: false,
  activeMentor: 'nix',
  activeBroker: 'glitch',
};

export function getMentorCharacter(): CharacterConfig {
  return CHARACTERS[CHARACTER_MODE.activeMentor];
}

export function getBrokerCharacter(): CharacterConfig {
  if (CHARACTER_MODE.singleCharacterMode) {
    return CHARACTERS[CHARACTER_MODE.activeMentor];
  }
  return CHARACTERS[CHARACTER_MODE.activeBroker];
}

export function getCharacterById(id: string): CharacterConfig {
  if (id === 'alex') {
    return CHARACTERS.alex;
  }
  if (id === 'null_byte') {
    return CHARACTERS.null_byte;
  }
  if (id === 'glitch' && !CHARACTER_MODE.singleCharacterMode) {
    return CHARACTERS.glitch;
  }
  return CHARACTERS.nix;
}
