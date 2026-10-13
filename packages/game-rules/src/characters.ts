export interface CharacterConfig {
  id: string;
  name: string;
  title: string;
  role: 'mentor' | 'broker';
  avatar: string;
  portrait: string;
  themeColor: string;
  bio: string;
  signatureLine: string;
}

/**
 * Single source of truth for character roles and definitions.
 * Nix is the tactical mentor who translates mechanics into plain everyday language.
 * Glitch is the underground broker managing loan contracts, bounties, and black market access.
 */
export const CHARACTERS: Record<'nix' | 'glitch', CharacterConfig> = {
  nix: {
    id: 'nix',
    name: 'Nix',
    title: 'Veteran Street Decker',
    role: 'mentor',
    avatar: '/icons/glyph-camera.svg',
    portrait: 'nix',
    themeColor: 'accent',
    bio: 'Your street mentor. Explains Pot/Pan mechanics and terminal tricks in plain language.',
    signatureLine: 'Signal stable. Lock is local. Keep your fingers steady.',
  },
  glitch: {
    id: 'glitch',
    name: 'Glitch',
    title: 'Black Market Broker',
    role: 'broker',
    avatar: '/icons/glyph-relay.svg',
    portrait: 'glitch',
    themeColor: 'money',
    bio: 'Underground broker and loan liaison. Dispatches syndicate bounties and tracks your debt balance.',
    signatureLine: 'Kovacs Syndicate expects their cut. Let us see what you can crack.',
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
  if (id === 'glitch' && !CHARACTER_MODE.singleCharacterMode) {
    return CHARACTERS.glitch;
  }
  return CHARACTERS.nix;
}
