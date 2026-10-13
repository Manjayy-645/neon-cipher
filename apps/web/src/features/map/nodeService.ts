import mockNodes from './nodes.mock.json';

export const NODE_STATUSES = ['available', 'owned', 'contested', 'cooldown'] as const;
export type NodeStatus = (typeof NODE_STATUSES)[number];

export const PLATE_STATUSES = ['available', 'owned', 'contested', 'cooldown', 'locked'] as const;
export type PlateStatus = (typeof PLATE_STATUSES)[number];

export type District = 'slums' | 'commercial';

// Single source of truth for all node types
export const NODE_TYPES = [
  'atm',
  'vending',
  'register',
  'camera',
  'meter',
  'relay',
  'safe',
  'coinbox',
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export interface GameNode {
  id: string;
  name: string;
  type: NodeType;
  tier: number;
  district: District;
  x: number;
  y: number;
  digits: number;
  allowDuplicates: boolean;
  attempts: number;
  timerSeconds: number;
  bounty: number;
  traceRisk: number;
  status: NodeStatus;
  cooldownEndsAt?: number;
  requiresUnlock: boolean;
}

export function getNodes(): GameNode[] {
  return mockNodes as GameNode[];
}

// Strictest typing: exactly maps every NodeType to its glyph name.
// TypeScript will fail compilation if any NodeType lacks a glyph, or if any glyph key is not a valid NodeType.
export const GLYPH_BY_TYPE: Record<NodeType, `glyph-${NodeType}`> = {
  atm: 'glyph-atm',
  vending: 'glyph-vending',
  register: 'glyph-register',
  camera: 'glyph-camera',
  meter: 'glyph-meter',
  relay: 'glyph-relay',
  safe: 'glyph-safe',
  coinbox: 'glyph-coinbox',
};

// Compile-time assertion that NodeType and keyof typeof GLYPH_BY_TYPE are strictly identical
type CheckExactKeys<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AssertGlyphKeysMatchNodeType = CheckExactKeys<NodeType, keyof typeof GLYPH_BY_TYPE>;

export const FALLBACK_GLYPH = 'glyph-fallback';

/**
 * Resolves the glyph asset name for a given node type.
 * Fails loudly in development/test, but falls back to a neutral glyph and logs in production.
 */
export function getGlyphForType(type: NodeType | string): string {
  const glyph = GLYPH_BY_TYPE[type as NodeType];
  if (!glyph) {
    const errorMsg = `Unknown node type "${type}": no glyph file exists. Expected one of: ${NODE_TYPES.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      console.error(errorMsg);
      return FALLBACK_GLYPH;
    }
    throw new Error(errorMsg);
  }
  return glyph;
}
