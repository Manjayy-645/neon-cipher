import mockNodes from './nodes.mock.json';
import { NODES as MAP_NODES, TIERS } from './map-data';

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

const mapNodesAsGameNodes: GameNode[] = MAP_NODES.map((m) => {
  const tierConfig = TIERS[m.tier] || TIERS[1];
  return {
    id: m.id,
    name: m.n,
    type: m.t as NodeType,
    tier: m.tier,
    district: m.z === 'S' ? 'slums' : 'commercial',
    x: m.x,
    y: m.y,
    digits: tierConfig.d,
    allowDuplicates: tierConfig.dup === 1,
    attempts: tierConfig.tries,
    timerSeconds: tierConfig.secs,
    bounty: tierConfig.b,
    traceRisk: m.tier === 1 ? 10 : m.tier === 2 ? 30 : 60,
    status: m.st,
    cooldownEndsAt: m.cd ? Date.now() + m.cd * 1000 : undefined,
    requiresUnlock: m.z === 'C',
  };
});

const tutorialSodaNode: GameNode = {
  id: 'tutorial-soda',
  name: 'Rusty Soda Machine',
  type: 'vending',
  tier: 1,
  district: 'slums',
  x: 20,
  y: 12,
  digits: 3,
  allowDuplicates: false,
  attempts: 999,
  timerSeconds: 0,
  bounty: 120,
  traceRisk: 0,
  status: 'available',
  requiresUnlock: false,
};

const nixRecoveryNode: GameNode = {
  id: 'nix-recovery',
  name: "Nix's Recovery Run",
  type: 'vending',
  tier: 1,
  district: 'slums',
  x: 20,
  y: 12,
  digits: 3,
  allowDuplicates: false,
  attempts: 999,
  timerSeconds: 0,
  bounty: 0,
  traceRisk: 0,
  status: 'available',
  requiresUnlock: false,
};

const allRegisteredNodes: GameNode[] = [
  ...(mockNodes as GameNode[]),
  ...mapNodesAsGameNodes,
  tutorialSodaNode,
  nixRecoveryNode,
];

export function getNodes(): GameNode[] {
  return mockNodes as GameNode[];
}

export function getNodeById(id: string): GameNode | undefined {
  if (!id) return undefined;
  const directMatch = allRegisteredNodes.find((n) => n.id.toLowerCase() === id.toLowerCase());
  if (directMatch) return directMatch;

  // Fallback alias mappings between s/c codes and n codes
  const aliasMap: Record<string, string> = {
    s1: 'n1',
    s2: 'n5',
    s3: 'n6',
    s4: 'n8',
    s5: 'n4',
    s6: 'n7',
    s7: 'n15',
    s8: 'n2',
    c1: 'n9',
    c2: 'n12',
    c3: 'n11',
    c4: 'n3',
    c5: 'n14',
    c6: 'n10',
    c7: 'n13',
    n1: 's1',
    n4: 's5',
  };
  const aliasId = aliasMap[id.toLowerCase()];
  if (aliasId) {
    const aliasNode = allRegisteredNodes.find((n) => n.id.toLowerCase() === aliasId.toLowerCase());
    if (aliasNode) return { ...aliasNode, id };
  }

  return undefined;
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
