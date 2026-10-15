import { GameNode, getNodes } from '@/features/map/nodeService';
import { AccountSettings } from '@/features/settings/types';
import { DuelFeedEvent, DuelSession } from '@/features/duel/types';
import {
  CHAPTERS,
  getChapterById,
  INITIAL_DEBT,
  ChapterData,
  IceType,
  calculateNodeIncome,
  generateCode,
  calculateScore,
  calculateDuelPot,
  calculateDoubleOrNothing,
  isExploitAllowed,
  SABOTAGE_RULES,
  SABOTAGE_TOOL_CATALOG,
  normalizeSabotageToolId,
  generateNullByteGuess,
  DuelMatchType,
  DuelPacingMode,
  GUESS_CLOCK_MS,
  pickConsistentGuess,
  GuessRecord,
  STEALTH_GUESS_COST,
  generateFalseFlagClue,
  COOP_STAGE_TEMPLATES,
  calculateCoopReward,
  validateCoopGuess,
  calculateCoopPayout,
  findDeadDigitsForAlpha,
  CoopRole,
  CoopStageConfig,
  CoopGuessRecord,
  CoopPayoutResult,
  createCoopHeistState,
  submitStage1Guess,
  checkStage1SyncTimeout,
  pingDigitStage2,
  flushIceStage2,
  submitStage2Guess,
  submitStage3Guess,
  triggerOverdriveStage3,
  getNixCoopCallout,
  getNixRoleBriefing,
  CoopHeistState,
  CoopHeistSecrets,
  CoopTelemetryEvent,
  DigitPingStatus,
  CoopStageId,
  CoopHeistStatus,
  normalizeCoopRole,
  DUAL_KEY_SYNC_WINDOW_MS,
  OVERDRIVE_FREEZE_MS,
  DeckerProfile,
  SkillNode,
  FactionStanding,
  DailyBreachData,
  Achievement,
  BreachReplay,
  FriendProfile,
  AppNotification,
  calculateWinRate,
  canUnlockSkill,
  respecSkillTree,
  SPECIALIZATION_SKILLS,
  FACTION_CATALOG,
  analyzeBreachReplay,
  getStandingLevel,
  checkMutualExclusion,
  getDailyBreachSeed,
  HardwareRailSlot,
  RigHardwareId,
  RigHardwareModule,
  RIG_HARDWARE_MODULES,
  RIG_PRESETS,
  computeEffectiveRigStats,
  calculateParityDistribution,
  equipRailModule,
  applyRigPreset,
} from '@neon-cipher/game-rules/src/index';

export interface ChapterProgress {
  id: string;
  status: 'locked' | 'available' | 'active' | 'completed';
  completedAt?: number;
}

export interface CampaignState {
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
}

export interface Session {
  id: string;
  nodeId: string;
  secret: string;
  attemptsLeft: number;
  startedAt: number;
  status: 'active' | 'won' | 'lost';
  node: GameNode;
  eliminatedDigits?: string[];
  ice?: IceType;
  recovery?: boolean;
}

export type TransactionCategory =
  | 'payout'
  | 'fine'
  | 'purchase'
  | 'repair'
  | 'safehouse'
  | 'dividend'
  | 'initial';

export interface Transaction {
  id: string;
  timestamp: number;
  source: string;
  amount: number; // positive or negative
  currency: 'credits' | 'coins';
  runningBalance: number;
  category: TransactionCategory;
}

export interface WalletData {
  credits: number;
  coins: number;
  inventory: Record<string, number>;
  equippedTools: string[];
  equippedRails?: Partial<Record<HardwareRailSlot, RigHardwareId | null>>;
}

export interface RigHardwareItem {
  id: string;
  name: string;
  installed: boolean;
  burned: boolean;
  repairCost: number;
  slot: 'memory-1' | 'memory-2' | 'coprocessor' | 'memory_1' | 'memory_2' | 'bus_interconnect';
  railSlot?: HardwareRailSlot;
  buildArchetype?: string;
  effect: string;
  mechanicalEffect?: string;
  tradeOff?: string;
  alexExplanation?: string;
  nixTip: string;
  glitchPitch?: string;
}

export interface SafehouseProperty {
  id: string;
  name: string;
  district: 'slums' | 'industrial' | 'commercial';
  tier: number;
  cost: number;
  upkeep: number; // credits per day
  dailyDividend: number; // credits per day
  traceReductionPercent: number;
  owned: boolean;
  accumulatedDividends: number;
  lastClaimedAt: number;
  description: string;
}

export interface NodeDefense {
  nodeId: string;
  code: string;
  ice: IceType;
  iceModifiers: IceType[];
  dailyBudget: number;
  finesEarned: number;
  lastMaintainedAt: number;
  lastCollectedAt: number;
  ownerHandle: string;
}

const defaultNodeDefenses: Record<string, NodeDefense> = {
  n2: {
    nodeId: 'n2',
    code: '4921',
    ice: 'Ghost',
    iceModifiers: ['Ghost'],
    dailyBudget: 250,
    finesEarned: 150,
    lastMaintainedAt: Date.now() - 3600000 * 4,
    lastCollectedAt: Date.now() - 3600000 * 4,
    ownerHandle: 'ZERO_COOL',
  },
  n11: {
    nodeId: 'n11',
    code: '6183',
    ice: 'Liar',
    iceModifiers: ['Liar'],
    dailyBudget: 400,
    finesEarned: 300,
    lastMaintainedAt: Date.now() - 3600000 * 2,
    lastCollectedAt: Date.now() - 3600000 * 2,
    ownerHandle: 'ZERO_COOL',
  },
};

const defaultWallet: WalletData = {
  credits: 12500,
  coins: 45,
  inventory: {
    'tool-static-injector': 2,
    'tool-firewall-patch': 1,
    'cryo_spike': 1,
    'cleanse_subroutine': 1,
    'memory_buffer_mk1': 1,
    'rig-memory-buffer-1': 1,
  },
  equippedTools: ['tool-static-injector'],
  equippedRails: {
    memory_1: null,
    memory_2: null,
    coprocessor: null,
    bus_interconnect: null,
  },
};

const defaultRigHardware: Record<string, RigHardwareItem> = {
  // --- 4-RAIL CYBERDECK MODULES ---
  'memory_buffer_mk1': {
    id: 'memory_buffer_mk1',
    name: 'Memory Buffer Mk I',
    installed: false,
    burned: false,
    repairCost: 650,
    slot: 'memory_1',
    railSlot: 'memory_1',
    buildArchetype: 'Balanced / Rookie',
    effect: '+1 max guess attempt on Tier 1 & Tier 2 nodes.',
    mechanicalEffect: '+1 max guess attempt on Tier 1 & Tier 2 nodes.',
    tradeOff: 'No attempt bonus on Tier 3+ corporate nodes.',
    alexExplanation: "Solid starter RAM. Gives you one extra try on street locks so a bad guess doesn't fry your run.",
    nixTip: 'Gives you breathing room on street terminals. An extra probe before ICE trips.',
    glitchPitch: 'Street-grade RAM chips pulled from defunct ATMs. Reliable, simple, and cheap.',
  },
  'neural_reflex_cap': {
    id: 'neural_reflex_cap',
    name: 'Neural Reflex Capacitor',
    installed: false,
    burned: false,
    repairCost: 2800,
    slot: 'memory_1',
    railSlot: 'memory_1',
    buildArchetype: 'Speed / Duelist',
    effect: 'Submitting a guess within 4 seconds of your previous turn does not consume an attempt pip (Triggers max once per breach).',
    mechanicalEffect: 'Submitting a guess within 4 seconds of your previous turn does not consume an attempt pip (Triggers max once per breach).',
    tradeOff: 'Requires quick decision making; triggers at most once per breach.',
    alexExplanation: 'Built for fast fingers. Punch your follow-up guess in under 4 seconds and the capacitor gives you that turn for free.',
    nixTip: 'If your deduction is mapped out ahead of time, double-tap quickly to earn a free turn.',
    glitchPitch: 'Military twitch-capacitors wired straight into optical relays. Rewards split-second execution.',
  },
  'memory_buffer_mk2': {
    id: 'memory_buffer_mk2',
    name: 'Memory Buffer Mk II',
    installed: false,
    burned: false,
    repairCost: 2200,
    slot: 'memory_2',
    railSlot: 'memory_2',
    buildArchetype: 'Deep Breaker',
    effect: '+1 max guess attempt on Tier 3, Tier 4 & Tier 5 nodes.',
    mechanicalEffect: '+1 max guess attempt on Tier 3, Tier 4 & Tier 5 nodes.',
    tradeOff: 'High heat density; provides no bonus on Tier 1 or 2 street locks.',
    alexExplanation: 'Heavy-duty buffer for corporate vaults where every single attempt counts.',
    nixTip: 'High-spec memory rail for corporate relays. Protects against tight attempt limits.',
    glitchPitch: 'Enterprise server cache modules. When you hit downtown databanks, you will thank me.',
  },
  'syndicate_skimmer': {
    id: 'syndicate_skimmer',
    name: 'Syndicate Skimmer Chip',
    installed: false,
    burned: false,
    repairCost: 3100,
    slot: 'memory_2',
    railSlot: 'memory_2',
    buildArchetype: 'Cash Farmer',
    effect: 'Every Pan (Green exact match) scored on your very first guess immediately deposits a $45 bonus into your wallet, win or lose.',
    mechanicalEffect: 'Every Pan (Green exact match) scored on your very first guess immediately deposits a $45 bonus into your wallet, win or lose.',
    tradeOff: 'Occupies Memory Rail 2; gives up the +1 attempt buffer of Memory Buffer Mk II.',
    alexExplanation: 'Siphons loose credits right off the first handshake. Great for farming quick cash in The Slums.',
    nixTip: 'Lead with diverse high-frequency probe digits on Turn 1 to maximize early Pan payouts.',
    glitchPitch: 'Custom Kovacs firmware tap. Turns initial cryptographic syncs into pure street money.',
  },
  'heuristic_coproc': {
    id: 'heuristic_coproc',
    name: 'Heuristic Co-Processor',
    installed: false,
    burned: false,
    repairCost: 1500,
    slot: 'coprocessor',
    railSlot: 'coprocessor',
    buildArchetype: 'Eliminator',
    effect: 'Automatically crosses off and dims 2 confirmed dead digits on the keypad as soon as you jack in.',
    mechanicalEffect: 'Automatically crosses off and dims 2 confirmed dead digits on the keypad as soon as you jack in.',
    tradeOff: 'Occupies Co-Processor socket; cannot equip Parity Scanner ASIC simultaneously.',
    alexExplanation: 'Cuts the guesswork down before you even touch a key. Removes two dead numbers right on boot.',
    nixTip: 'Instantly burns away two false digits right when you jack in. Cuts guesswork in half.',
    glitchPitch: 'Pre-flight signal filter that purges dead carrier noise before you even touch the keys.',
  },
  'parity_scanner_asic': {
    id: 'parity_scanner_asic',
    name: 'Parity Scanner ASIC',
    installed: false,
    burned: false,
    repairCost: 1800,
    slot: 'coprocessor',
    railSlot: 'coprocessor',
    buildArchetype: 'Analytical',
    effect: 'On boot, displays the exact count of EVEN vs. ODD digits in the secret code (e.g., [2 EVEN / 2 ODD]).',
    mechanicalEffect: 'On boot, displays the exact count of EVEN vs. ODD digits in the secret code (e.g., [2 EVEN / 2 ODD]).',
    tradeOff: 'Does not eliminate digits directly; relies on player mathematical deduction.',
    alexExplanation: 'Instead of crossing off two numbers, this tells you the exact balance of Even and Odd numbers in the lock.',
    nixTip: 'Even numbers are 0, 2, 4, 6, 8. Odd numbers are 1, 3, 5, 7, 9. Use this distribution to structure your probes.',
    glitchPitch: 'Dedicated ASIC math coprocessor that sniffs bus parity harmonics in micro-seconds.',
  },
  'overclocked_quartz_bus': {
    id: 'overclocked_quartz_bus',
    name: 'Overclocked Quartz Bus',
    installed: false,
    burned: false,
    repairCost: 2400,
    slot: 'bus_interconnect',
    railSlot: 'bus_interconnect',
    buildArchetype: 'High-Risk Blitz',
    effect: 'Grants +15 seconds to all trace timers and +20% Credit Bounty, but reduces max attempts by -1 (min 3 attempts).',
    mechanicalEffect: 'Grants +15 seconds to all trace timers and +20% Credit Bounty, but reduces max attempts by -1 (min 3 attempts).',
    tradeOff: 'Runs hot—reduces max attempts by 1 attempt.',
    alexExplanation: 'Pushes your clock and payout through the roof, but runs hot—costs you 1 attempt slot. Only equip if your deduction is sharp.',
    nixTip: 'High-risk, high-reward interconnect. The extra clock lets you think, but you have fewer attempts to fail.',
    glitchPitch: 'Over-volted quartz oscillator. Drives up the score and buys you clock time, if you can stand the heat.',
  },
  'lead_shielded_chassis': {
    id: 'lead_shielded_chassis',
    name: 'Lead-Shielded Chassis',
    installed: false,
    burned: false,
    repairCost: 1950,
    slot: 'bus_interconnect',
    railSlot: 'bus_interconnect',
    buildArchetype: 'Tank / Low-Heat',
    effect: 'Reduces failure fines by 60%, cuts Sector Heat buildup by 50%, and prevents hardware burn on Tier 5 lockouts.',
    mechanicalEffect: 'Reduces failure fines by 60%, cuts Sector Heat buildup by 50%, and prevents hardware burn on Tier 5 lockouts.',
    tradeOff: 'No timer extensions or bounty payout multipliers.',
    alexExplanation: 'Heavy lead lining. If a tough vault locks you out, you barely pay a fine and your rig stays safe from burn damage.',
    nixTip: 'Defensive chassis plating. Essential when probing high-security nodes where failure penalties are brutal.',
    glitchPitch: 'Military-grade lead plating. Security trace spikes bounce right off your deck casing.',
  },

  // --- LEGACY COMPATIBILITY ALIASES ---
  'rig-memory-buffer-1': {
    id: 'rig-memory-buffer-1',
    name: 'Memory Buffer Mk I',
    installed: false,
    burned: false,
    repairCost: 650,
    slot: 'memory-1',
    railSlot: 'memory_1',
    buildArchetype: 'Balanced / Rookie',
    effect: '+1 maximum guess attempt on Tier 1 and 2 nodes permanently.',
    nixTip: "Gives you breathing room on street terminals. An extra probe before ICE trips.",
  },
  'rig-memory-buffer-2': {
    id: 'rig-memory-buffer-2',
    name: 'Memory Buffer Mk II',
    installed: false,
    burned: false,
    repairCost: 2200,
    slot: 'memory-2',
    railSlot: 'memory_2',
    buildArchetype: 'Deep Breaker',
    effect: '+1 maximum guess attempt on Tier 3 and 4 nodes permanently.',
    nixTip: "High-spec memory rail for corporate relays. Protects against tight attempt limits.",
  },
  'rig-heuristic-coprocessor': {
    id: 'rig-heuristic-coprocessor',
    name: 'Heuristic Co-Processor',
    installed: false,
    burned: false,
    repairCost: 1500,
    slot: 'coprocessor',
    railSlot: 'coprocessor',
    buildArchetype: 'Eliminator',
    effect: 'Automatically analyzes carrier waves to eliminate two dead digits at hack start.',
    nixTip: "Instantly burns away two false digits right when you jack in. Cuts guesswork in half.",
  },
};

const defaultSafehouses: Record<string, SafehouseProperty> = {
  'safehouse-slums': {
    id: 'safehouse-slums',
    name: 'Slums Underpass Bunker',
    district: 'slums',
    tier: 1,
    cost: 15000,
    upkeep: 120,
    dailyDividend: 450,
    traceReductionPercent: 15,
    owned: true,
    accumulatedDividends: 350,
    lastClaimedAt: Date.now() - 3600000 * 18,
    description: 'Reinforced concrete basement tucked below the highway overpass. Good for laying low and siphoning street power.',
  },
  'safehouse-industrial': {
    id: 'safehouse-industrial',
    name: 'Industrial Warehouse Loft',
    district: 'industrial',
    tier: 2,
    cost: 35000,
    upkeep: 280,
    dailyDividend: 1200,
    traceReductionPercent: 30,
    owned: false,
    accumulatedDividends: 0,
    lastClaimedAt: Date.now(),
    description: 'Abandoned optical manufacturing facility. High-voltage power feeds and RF shielding suppress corporate trace scans.',
  },
  'safehouse-commercial': {
    id: 'safehouse-commercial',
    name: 'Meridian Penthouse Enclave',
    district: 'commercial',
    tier: 3,
    cost: 85000,
    upkeep: 650,
    dailyDividend: 3500,
    traceReductionPercent: 50,
    owned: false,
    accumulatedDividends: 0,
    lastClaimedAt: Date.now(),
    description: 'Luxury high-rise safehouse overlooking the central plaza. Direct backbone fiber taps and diplomatic RF immunity.',
  },
};

const defaultTransactions: Transaction[] = [
  {
    id: 'tx-1',
    timestamp: Date.now() - 3600000 * 24,
    source: 'Starting Syndicate Bankroll',
    amount: 10000,
    currency: 'credits',
    runningBalance: 10000,
    category: 'initial',
  },
  {
    id: 'tx-2',
    timestamp: Date.now() - 3600000 * 24,
    source: 'Initial Testnet Seed',
    amount: 50,
    currency: 'coins',
    runningBalance: 50,
    category: 'initial',
  },
  {
    id: 'tx-3',
    timestamp: Date.now() - 3600000 * 12,
    source: 'Breach: Rusty Vending',
    amount: 50,
    currency: 'credits',
    runningBalance: 10050,
    category: 'payout',
  },
  {
    id: 'tx-4',
    timestamp: Date.now() - 3600000 * 8,
    source: 'Breach: Alley Relay',
    amount: 150,
    currency: 'credits',
    runningBalance: 10200,
    category: 'payout',
  },
  {
    id: 'tx-5',
    timestamp: Date.now() - 3600000 * 5,
    source: 'Market: Digit Scrub',
    amount: -5,
    currency: 'coins',
    runningBalance: 45,
    category: 'purchase',
  },
  {
    id: 'tx-6',
    timestamp: Date.now() - 3600000 * 2,
    source: 'Daily Dividend: Slums Nodes',
    amount: 2300,
    currency: 'credits',
    runningBalance: 12500,
    category: 'dividend',
  },
];

export interface MockAccount {
  id: string;
  handle: string;
  avatarUrl: string;
  createdAt: number;
  settings: AccountSettings;
  wallet: WalletData;
  rigHardware: Record<string, RigHardwareItem>;
  safehouses: Record<string, SafehouseProperty>;
  transactions: Transaction[];
  campaignProgress: {
    chapter: number;
    completedNodes: string[];
  };
}

export const defaultSettings: AccountSettings = {
  rookieAssist: true,
  reducedMotion: 'system',
  colorBlindMode: false,
  audio: {
    keystrokes: 70,
    ui: 80,
    ambient: 50,
  },
  dailySpendLimit: null,
};

const initialAccounts: Record<string, MockAccount> = {
  'ZERO_COOL': {
    id: 'acc-zero-cool',
    handle: 'ZERO_COOL',
    avatarUrl: '', // Neutral fallback (initial or silhouette)
    createdAt: Date.now() - 3600000 * 48,
    settings: { ...defaultSettings },
    wallet: defaultWallet,
    rigHardware: defaultRigHardware,
    safehouses: defaultSafehouses,
    transactions: defaultTransactions,
    campaignProgress: {
      chapter: 1,
      completedNodes: [],
    },
  },
  'PHREAK': {
    id: 'acc-phreak',
    handle: 'PHREAK',
    avatarUrl: '/icons/glyph-router.svg',
    createdAt: Date.now() - 3600000 * 24,
    settings: {
      ...defaultSettings,
      rookieAssist: false, // Pro mode decker
      audio: { keystrokes: 90, ui: 60, ambient: 40 },
    },
    wallet: {
      credits: 3200,
      coins: 15,
      inventory: {
        'tool-static-injector': 1,
      },
      equippedTools: [],
    },
    rigHardware: { ...defaultRigHardware },
    safehouses: { ...defaultSafehouses },
    transactions: [],
    campaignProgress: {
      chapter: 1,
      completedNodes: [],
    },
  },
};

export const defaultCampaignState: CampaignState = {
  debt: {
    initial: INITIAL_DEBT,
    current: INITIAL_DEBT,
    paid: 0,
  },
  chapters: {
    'chapter-1': { id: 'chapter-1', status: 'available' },
    'chapter-2': { id: 'chapter-2', status: 'locked' },
    'chapter-3': { id: 'chapter-3', status: 'locked' },
    'chapter-4': { id: 'chapter-4', status: 'locked' },
  },
  activeChapterId: 'chapter-1',
  unlocks: {
    blackMarket: false,
    onlinePlay: false,
    bridge: false,
  },
  tutorials: {
    'chapter-1': { completed: false, skipped: false },
    'chapter-2': { completed: false, skipped: false },
  },
};

// Global variables to survive hot reloads in Next.js development
const globalForDb = global as unknown as {
  mockSessions: Map<string, Session>;
  mockWallet: WalletData;
  mockTransactions: Transaction[];
  mockRigHardware: Record<string, RigHardwareItem>;
  mockSafehouses: Record<string, SafehouseProperty>;
  mockAccounts: Record<string, MockAccount>;
  activeAccountId: string;
  mockCampaign: CampaignState;
  mockNodeDefenses: Record<string, NodeDefense>;
};

export const mockSessions = globalForDb.mockSessions || new Map<string, Session>();
export const mockWallet = globalForDb.mockWallet || { ...defaultWallet };
export const mockTransactions = globalForDb.mockTransactions || [...defaultTransactions];
export const mockRigHardware = globalForDb.mockRigHardware || { ...defaultRigHardware };
export const mockSafehouses = globalForDb.mockSafehouses || { ...defaultSafehouses };
export const mockAccounts = globalForDb.mockAccounts || { ...initialAccounts };
export let activeAccountId = globalForDb.activeAccountId || 'ZERO_COOL';
export const mockCampaign = globalForDb.mockCampaign || JSON.parse(JSON.stringify(defaultCampaignState));
export const mockNodeDefenses = globalForDb.mockNodeDefenses || { ...defaultNodeDefenses };

if (process.env.NODE_ENV !== 'production') {
  globalForDb.mockSessions = mockSessions;
  globalForDb.mockWallet = mockWallet;
  globalForDb.mockTransactions = mockTransactions;
  globalForDb.mockRigHardware = mockRigHardware;
  globalForDb.mockSafehouses = mockSafehouses;
  globalForDb.mockAccounts = mockAccounts;
  globalForDb.activeAccountId = activeAccountId;
  globalForDb.mockCampaign = mockCampaign;
  globalForDb.mockNodeDefenses = mockNodeDefenses;
}

export function getActiveAccount(): MockAccount {
  const account = mockAccounts[activeAccountId] || mockAccounts['ZERO_COOL'];
  if (!account) {
    mockAccounts['ZERO_COOL'] = {
      id: 'acc-zero-cool',
      handle: 'ZERO_COOL',
      avatarUrl: '/Character portraits/Player avatars.png',
      createdAt: Date.now(),
      settings: { ...defaultSettings },
      wallet: mockWallet,
      rigHardware: mockRigHardware,
      safehouses: mockSafehouses,
      transactions: mockTransactions,
      campaignProgress: { chapter: 1, completedNodes: [] },
    };
    return mockAccounts['ZERO_COOL'];
  }
  return account;
}

export function setActiveAccount(handleOrId: string): MockAccount {
  const found = Object.values(mockAccounts).find(
    (a) => a.handle.toUpperCase() === handleOrId.toUpperCase() || a.id === handleOrId
  );
  if (found) {
    activeAccountId = found.handle;
    if (process.env.NODE_ENV !== 'production') {
      globalForDb.activeAccountId = activeAccountId;
    }
    // Sync current globals to this account's wallet
    Object.assign(mockWallet, found.wallet);
    return found;
  }
  throw new Error(`Account not found: ${handleOrId}`);
}

export function createAccount(handle: string, avatarUrl: string): MockAccount {
  const cleanHandle = handle.trim().toUpperCase();
  const existing = Object.values(mockAccounts).find((a) => a.handle.toUpperCase() === cleanHandle);
  if (existing) {
    setActiveAccount(existing.handle);
    return existing;
  }

  const newAcc: MockAccount = {
    id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    handle: cleanHandle,
    avatarUrl: avatarUrl || '/Character portraits/Player avatars.png',
    createdAt: Date.now(),
    settings: { ...defaultSettings },
    wallet: {
      credits: 10000,
      coins: 25,
      inventory: {
        'tool-static-injector': 1,
      },
      equippedTools: ['tool-static-injector'],
    },
    rigHardware: { ...defaultRigHardware },
    safehouses: { ...defaultSafehouses },
    transactions: [
      {
        id: `tx-init-${Date.now()}`,
        timestamp: Date.now(),
        source: 'Syndicate Starter Bankroll',
        amount: 10000,
        currency: 'credits',
        runningBalance: 10000,
        category: 'initial',
      },
    ],
    campaignProgress: {
      chapter: 1,
      completedNodes: [],
    },
  };

  mockAccounts[cleanHandle] = newAcc;
  setActiveAccount(cleanHandle);
  return newAcc;
}

export function updateAccountSettings(
  newSettings: Partial<AccountSettings>,
  handleOrId?: string
): AccountSettings {
  const account = handleOrId ? (mockAccounts[handleOrId] || getActiveAccount()) : getActiveAccount();
  account.settings = {
    ...account.settings,
    ...newSettings,
    audio: {
      ...account.settings.audio,
      ...(newSettings.audio || {}),
    },
  };
  return account.settings;
}

export function resetAccountCampaign(handleOrId?: string): MockAccount {
  const account = handleOrId ? (mockAccounts[handleOrId] || getActiveAccount()) : getActiveAccount();
  account.campaignProgress = {
    chapter: 1,
    completedNodes: [],
  };
  account.wallet.credits = 10000;
  account.wallet.coins = 25;
  account.wallet.inventory = {
    'tool-static-injector': 1,
  };
  account.wallet.equippedTools = ['tool-static-injector'];
  account.transactions = [
    {
      id: `tx-reset-${Date.now()}`,
      timestamp: Date.now(),
      source: 'Deck Memory Purge & Syndicate Reset',
      amount: 10000,
      currency: 'credits',
      runningBalance: 10000,
      category: 'initial',
    },
  ];
  // Sync to mockWallet
  Object.assign(mockWallet, account.wallet);
  return account;
}

export function exportAccountData(handleOrId?: string): object {
  const account = handleOrId ? (mockAccounts[handleOrId] || getActiveAccount()) : getActiveAccount();
  return {
    exportVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    account: {
      id: account.id,
      handle: account.handle,
      avatarUrl: account.avatarUrl,
      createdAt: account.createdAt,
    },
    settings: account.settings,
    wallet: account.wallet,
    rigHardware: account.rigHardware,
    safehouses: account.safehouses,
    transactions: account.transactions,
    campaignProgress: account.campaignProgress,
  };
}

/**
 * Record a transaction into the mock server ledger and update balances
 */
export function recordTransaction(
  sourceOrParams: string | { source: string; amount: number; currency: 'credits' | 'coins'; category: TransactionCategory },
  amountParam?: number,
  currencyParam?: 'credits' | 'coins',
  categoryParam?: TransactionCategory
): Transaction {
  const source = typeof sourceOrParams === 'object' ? sourceOrParams.source : sourceOrParams;
  const amount = typeof sourceOrParams === 'object' ? sourceOrParams.amount : amountParam!;
  const currency = typeof sourceOrParams === 'object' ? sourceOrParams.currency : currencyParam!;
  const category = typeof sourceOrParams === 'object' ? sourceOrParams.category : categoryParam!;

  mockWallet[currency] = Math.max(0, mockWallet[currency] + amount);

  const tx: Transaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    source,
    amount,
    currency,
    runningBalance: mockWallet[currency],
    category,
  };

  mockTransactions.unshift(tx);
  return tx;
}

/**
 * Trigger catastrophic ICE burnout on a random installed hardware item (Tier 5 failure)
 */
export function burnInstalledHardware(): RigHardwareItem | null {
  // Lead-Shielded Chassis prevents hardware burn on Tier 5 lockouts
  const shieldedChassis = mockRigHardware['lead_shielded_chassis'];
  if (shieldedChassis && shieldedChassis.installed && !shieldedChassis.burned) {
    return null;
  }
  const installedItems = Object.values(mockRigHardware).filter((h) => h.installed && !h.burned);
  if (installedItems.length === 0) return null;

  const target = installedItems[Math.floor(Math.random() * installedItems.length)];
  target.burned = true;

  // Sync alias in mockRigHardware
  const aliasMap: Record<string, string> = {
    'rig-memory-buffer-1': 'memory_buffer_mk1',
    'memory_buffer_mk1': 'rig-memory-buffer-1',
    'rig-memory-buffer-2': 'memory_buffer_mk2',
    'memory_buffer_mk2': 'rig-memory-buffer-2',
    'rig-heuristic-coprocessor': 'heuristic_coproc',
    'heuristic_coproc': 'rig-heuristic-coprocessor',
  };
  const alias = aliasMap[target.id];
  if (alias && mockRigHardware[alias]) {
    mockRigHardware[alias].burned = true;
  }
  if (mockWallet.equippedRails) {
    for (const [rail, modId] of Object.entries(mockWallet.equippedRails)) {
      if (modId === target.id || modId === alias) {
        mockWallet.equippedRails[rail as HardwareRailSlot] = null;
      }
    }
  }

  return target;
}

/**
 * Campaign State & Progression Methods (Task 10)
 */
export function getCampaignState(): CampaignState {
  return mockCampaign;
}

export function acceptChapterAssignment(chapterId: string): CampaignState {
  const chapter = getChapterById(chapterId);
  if (!chapter) throw new Error(`Invalid chapter: ${chapterId}`);

  mockCampaign.activeChapterId = chapterId;
  if (!mockCampaign.chapters[chapterId]) {
    mockCampaign.chapters[chapterId] = { id: chapterId, status: 'active' };
  } else if (mockCampaign.chapters[chapterId].status !== 'completed') {
    mockCampaign.chapters[chapterId].status = 'active';
  }

  const account = getActiveAccount();
  if (account) {
    account.campaignProgress.chapter = chapter.number;
  }

  // Tactical Care Package reward for Chapter 3 acceptance/start:
  // Frequency Probe (x2) and Cryo-Pulse Spike (x1) to counter Distortion ICE
  if (chapterId === 'chapter-3' && !(mockCampaign as any).ch3CarePackageGranted) {
    (mockCampaign as any).ch3CarePackageGranted = true;
    mockWallet.inventory['tool-frequency-probe'] = (mockWallet.inventory['tool-frequency-probe'] || 0) + 2;
    mockWallet.inventory['tool-cryo-pulse'] = (mockWallet.inventory['tool-cryo-pulse'] || 0) + 1;
    recordTransaction('Kovacs Care Package: Frequency Probe (x2) + Cryo-Pulse Spike (x1)', 0, 'credits', 'payout');
  }

  return mockCampaign;
}

export function completeChapterAssignment(chapterId: string): {
  state: CampaignState;
  chapter: ChapterData;
  debtReduced: number;
  remainingDebt: number;
  payout: number;
} {
  const chapter = getChapterById(chapterId);
  if (!chapter) throw new Error(`Invalid chapter: ${chapterId}`);

  const prevStatus = mockCampaign.chapters[chapterId]?.status;
  const isFirstCompletion = prevStatus !== 'completed';

  mockCampaign.chapters[chapterId] = {
    id: chapterId,
    status: 'completed',
    completedAt: Date.now(),
  };

  let debtReduced = 0;
  if (isFirstCompletion) {
    debtReduced = chapter.contract.debtReduction;
    mockCampaign.debt.paid = Math.min(
      mockCampaign.debt.initial,
      mockCampaign.debt.paid + debtReduced
    );
    mockCampaign.debt.current = Math.max(0, mockCampaign.debt.initial - mockCampaign.debt.paid);

    recordTransaction(
      `Debt Relief: ${chapter.title} (Kovacs Syndicate)`,
      debtReduced,
      'credits',
      'payout'
    );

    const account = getActiveAccount();

    if (chapterId === 'chapter-2' || chapter.unlocksReward === 'blackMarket') {
      mockCampaign.unlocks.blackMarket = true;
      // Starter tool bundle for Chapter 2 completion:
      // Firewall Patch (x2) and Static Injector (x2)
      mockWallet.inventory['tool-firewall-patch'] = (mockWallet.inventory['tool-firewall-patch'] || 0) + 2;
      mockWallet.inventory['tool-static-injector'] = (mockWallet.inventory['tool-static-injector'] || 0) + 2;
      recordTransaction('Starter Intrusion Bundle: Firewall Patch (x2) + Static Injector (x2)', 0, 'credits', 'payout');
    }
    if (chapterId === 'chapter-3' || chapter.unlocksReward === 'bridge') {
      mockCampaign.unlocks.bridge = true;
    }
    if (chapterId === 'chapter-4' || chapter.unlocksReward === 'onlinePlay') {
      mockCampaign.unlocks.onlinePlay = true;
    }

    const nextChapter = CHAPTERS.find((c) => c.number === chapter.number + 1);
    if (nextChapter) {
      if (!mockCampaign.chapters[nextChapter.id] || mockCampaign.chapters[nextChapter.id].status === 'locked') {
        mockCampaign.chapters[nextChapter.id] = { id: nextChapter.id, status: 'available' };
      }
      mockCampaign.activeChapterId = nextChapter.id;
    } else {
      mockCampaign.activeChapterId = null;
    }

    if (mockCampaign.tutorials[chapterId]) {
      mockCampaign.tutorials[chapterId].completed = true;
    }
  }

  return {
    state: mockCampaign,
    chapter,
    debtReduced,
    remainingDebt: mockCampaign.debt.current,
    payout: chapter.contract.bounty,
  };
}

export function updateTutorialProgress(
  chapterId: string,
  update: { completed?: boolean; skipped?: boolean }
): CampaignState {
  if (!mockCampaign.tutorials[chapterId]) {
    mockCampaign.tutorials[chapterId] = { completed: false, skipped: false };
  }
  if (update.completed !== undefined) {
    mockCampaign.tutorials[chapterId].completed = update.completed;
  }
  if (update.skipped !== undefined) {
    mockCampaign.tutorials[chapterId].skipped = update.skipped;
  }
  return mockCampaign;
}

export function resetCampaignProgress(): CampaignState {
  mockCampaign.debt = {
    initial: INITIAL_DEBT,
    current: INITIAL_DEBT,
    paid: 0,
  };
  mockCampaign.chapters = {
    'chapter-1': { id: 'chapter-1', status: 'available' },
    'chapter-2': { id: 'chapter-2', status: 'locked' },
    'chapter-3': { id: 'chapter-3', status: 'locked' },
    'chapter-4': { id: 'chapter-4', status: 'locked' },
  };
  mockCampaign.activeChapterId = 'chapter-1';
  mockCampaign.unlocks = {
    blackMarket: false,
    onlinePlay: false,
    bridge: false,
  };
  mockCampaign.tutorials = {
    'chapter-1': { completed: false, skipped: false },
    'chapter-2': { completed: false, skipped: false },
  };
  (mockCampaign as any).ch3CarePackageGranted = false;
  return mockCampaign;
}

/**
 * Node Defense & Turf Management Methods (Task 12)
 */
export function getNodeDefense(nodeId: string): NodeDefense | undefined {
  return mockNodeDefenses[nodeId];
}

export function getAllNodeDefenses(): Record<string, NodeDefense> {
  return mockNodeDefenses;
}

export function setNodeDefense(
  nodeId: string,
  defense: Partial<NodeDefense>
): NodeDefense {
  const current = mockNodeDefenses[nodeId] || {
    nodeId,
    code: '1234',
    ice: 'None' as IceType,
    iceModifiers: [] as IceType[],
    dailyBudget: 150,
    finesEarned: 0,
    lastMaintainedAt: Date.now(),
    lastCollectedAt: Date.now(),
    ownerHandle: activeAccountId,
  };

  const updated: NodeDefense = {
    ...current,
    ...defense,
    nodeId,
    lastMaintainedAt: Date.now(),
  };

  mockNodeDefenses[nodeId] = updated;
  return updated;
}

export function creditDefenseFine(ownerHandle: string, fine: number, nodeId: string): void {
  const defense = mockNodeDefenses[nodeId];
  if (defense) {
    defense.finesEarned += fine;
  }
  const account = mockAccounts[ownerHandle];
  if (account) {
    account.wallet.credits += fine;
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      source: `Defense Fine: Breach Repelled on Node ${nodeId}`,
      amount: fine,
      currency: 'credits',
      runningBalance: account.wallet.credits,
      category: 'payout',
    };
    account.transactions.unshift(tx);
  }
}

export function claimNodeIncome(
  nodeId: string,
  ownerHandle: string
): { amount: number; balance: number } {
  const defense = mockNodeDefenses[nodeId];
  if (!defense) return { amount: 0, balance: 0 };

  const nodes = getNodes();
  const node = nodes.find((n) => n.id === nodeId);
  const hourlyYield = node ? Math.floor(node.bounty / 2) : 100;

  const income = calculateNodeIncome(hourlyYield, defense.lastCollectedAt, Date.now(), 1000);
  const amountToClaim = income.accumulatedYield;
  defense.lastCollectedAt = Date.now();

  const account = mockAccounts[ownerHandle] || getActiveAccount();
  account.wallet.credits += amountToClaim;

  if (amountToClaim > 0) {
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      source: `Turf Dividend: Node ${node?.name || nodeId}`,
      amount: amountToClaim,
      currency: 'credits',
      runningBalance: account.wallet.credits,
      category: 'dividend',
    };
    account.transactions.unshift(tx);
    if (activeAccountId === account.handle) {
      mockWallet.credits = account.wallet.credits;
    }
  }

  return { amount: amountToClaim, balance: account.wallet.credits };
}

export function transferNodeOwnership(nodeId: string, newOwnerHandle: string): NodeDefense {
  const current = mockNodeDefenses[nodeId] || {
    nodeId,
    code: '1234',
    ice: 'None' as IceType,
    iceModifiers: [] as IceType[],
    dailyBudget: 150,
    finesEarned: 0,
    lastMaintainedAt: Date.now(),
    lastCollectedAt: Date.now(),
    ownerHandle: newOwnerHandle,
  };

  current.ownerHandle = newOwnerHandle;
  current.lastCollectedAt = Date.now();
  current.lastMaintainedAt = Date.now();
  mockNodeDefenses[nodeId] = current;
  return current;
}

// ==========================================
// TASK 11: 1v1 DUEL & MATCHMAKING MOCK STATE
// ==========================================

export interface DuelRoom {
  id: string;
  name: string;
  host: string;
  matchType: DuelMatchType;
  pacingMode?: DuelPacingMode;
  wager: number;
  ante: number;
  pingMs: number;
  status: 'open' | 'active';
}

export interface DuelGuessRecord {
  guess: string;
  pots: number;
  pans: number;
  timestamp: number;
  cheatUsed?: boolean;
  isStealth?: boolean;
  falsified?: boolean;
  unmasked?: boolean;
  parityLabel?: 'EVEN' | 'ODD';
}

export interface DuelParticipant {
  handle: string;
  avatar: string;
  guesses: DuelGuessRecord[];
  activeEffects: Array<'scramble_keypad' | 'static_history' | 'drain_clock' | 'snoop_packet' | 'false_flag_echo' | 'key_latch' | 'logic_bomb' | 'parity_jam'>;
  staticExpiry?: number;
  shieldActive: boolean;
  cheatUsed: boolean;
  falseFlagActive?: boolean;
  snoopActive?: boolean;
  latchedKeys?: string[];
  activeLogicBomb?: { targetDigit: string; sourceDeckerId: string; armedBy?: string };
  parityJamActive?: boolean;
  defensiveBuffs?: any[];
  stealthChargesRemaining?: number;
}

export interface DuelSessionState {
  id: string;
  matchType: DuelMatchType;
  pacingMode: DuelPacingMode;
  wager: number;
  ante: number;
  totalPot: number;
  rake: number;
  netPot: number;
  secret: string; // SERVER ONLY!
  digits: number;
  sharedAttempts: number;
  playerAttempts: number;
  rivalAttempts: number;
  maxAttempts: number;
  guessClockMs: number;
  playerLastGuessAt: number;
  rivalLastGuessAt: number;
  rivalNextGuessDelayMs: number;
  turnClockSeconds: number;
  overallClockSeconds: number;
  startedAt: number;
  status: 'active' | 'player_won' | 'rival_won' | 'draw';
  winner?: 'player' | 'rival' | 'draw';
  finishTimeDeltaSeconds?: number;
  player: DuelParticipant;
  rival: DuelParticipant;
  currentTurn: 'player' | 'rival';
  feedEvents: DuelFeedEvent[];
}

const globalForDuel = global as unknown as {
  mockDuelRooms?: DuelRoom[];
  mockDuelSessions?: Map<string, DuelSessionState>;
};

export const mockDuelRooms: DuelRoom[] = globalForDuel.mockDuelRooms || [
  {
    id: 'room-01',
    name: 'Slums Underground #04',
    host: 'Crawl_Space',
    matchType: 'casual',
    wager: 0,
    ante: 0,
    pingMs: 24,
    status: 'open',
  },
  {
    id: 'room-02',
    name: 'The Core Relay #12',
    host: 'Data_Ghost',
    matchType: 'wager',
    wager: 500,
    ante: 50,
    pingMs: 48,
    status: 'open',
  },
  {
    id: 'room-03',
    name: 'Docks Carrier #08',
    host: 'Rust_Runner',
    matchType: 'wager',
    wager: 1000,
    ante: 100,
    pingMs: 112,
    status: 'open',
  },
  {
    id: 'room-04',
    name: 'Glitch Turf Arena',
    host: 'Glitch_Operative',
    matchType: 'turf',
    wager: 750,
    ante: 75,
    pingMs: 35,
    status: 'open',
  },
];

export const mockDuelSessions = globalForDuel.mockDuelSessions || new Map<string, DuelSessionState>();

if (process.env.NODE_ENV !== 'production') {
  globalForDuel.mockDuelRooms = mockDuelRooms;
  globalForDuel.mockDuelSessions = mockDuelSessions;
}

export function createDefaultDuelSession(duelId: string = 'duel-01'): DuelSessionState {
  const potCalc = calculateDuelPot(0);
  const secret = generateCode(4, false);
  return {
    id: duelId,
    matchType: 'casual',
    pacingMode: 'simultaneous',
    wager: 0,
    ante: 0,
    totalPot: potCalc.totalPot,
    rake: potCalc.rake,
    netPot: potCalc.netPot,
    secret,
    digits: 4,
    sharedAttempts: 12,
    playerAttempts: 7,
    rivalAttempts: 7,
    maxAttempts: 7,
    guessClockMs: GUESS_CLOCK_MS,
    playerLastGuessAt: Date.now(),
    rivalLastGuessAt: Date.now(),
    rivalNextGuessDelayMs: Math.floor(Math.random() * 5000) + 4000,
    turnClockSeconds: 20,
    overallClockSeconds: 90,
    startedAt: Date.now(),
    status: 'active',
    player: {
      handle: 'ZERO_COOL',
      avatar: '/Character portraits/Player avatars.png',
      guesses: [],
      activeEffects: [],
      shieldActive: false,
      cheatUsed: false,
    },
    rival: {
      handle: 'Null_Byte',
      avatar: '/Character portraits/Null_Byte.png',
      guesses: [],
      activeEffects: [],
      shieldActive: false,
      cheatUsed: false,
    },
    currentTurn: 'player',
    feedEvents: [],
  };
}

if (!mockDuelSessions.has('duel-01')) {
  mockDuelSessions.set('duel-01', createDefaultDuelSession('duel-01'));
}

export function getDuelRooms(): DuelRoom[] {
  return [...mockDuelRooms];
}

export function createDuelRoom(data: {
  name: string;
  matchType: DuelMatchType;
  wager: number;
  ante?: number;
  host?: string;
}): DuelRoom {
  const ante = data.ante ?? (data.wager > 0 ? Math.floor(data.wager * 0.1) : 0);
  const newRoom: DuelRoom = {
    id: `room-${Date.now().toString(36)}`,
    name: data.name,
    host: data.host ?? 'ZERO_COOL',
    matchType: data.matchType,
    wager: data.wager,
    ante,
    pingMs: Math.floor(Math.random() * 40) + 18,
    status: 'open',
  };
  mockDuelRooms.unshift(newRoom);
  return newRoom;
}

export function toSafeDuelSession(session: DuelSessionState): DuelSession {
  const isFinished = session.status !== 'active';
  const now = Date.now();
  const playerClockMs = Math.max(0, session.guessClockMs - (now - session.playerLastGuessAt));
  const rivalClockMs = Math.max(0, session.guessClockMs - (now - session.rivalLastGuessAt));

  const safeRivalGuesses = session.rival.guesses.map((g) => {
    if (!isFinished && g.isStealth && !g.unmasked) {
      return {
        ...g,
        guess: '****',
        pans: 0,
        pots: 0,
      };
    }
    return g;
  });

  const safeFeedEvents = session.feedEvents.map((ev) => {
    if (ev.who === 'rival' && !isFinished && ev.isStealth && !ev.unmasked) {
      return {
        ...ev,
        guess: null,
        pans: null,
        pots: null,
      };
    }
    return ev;
  });

  return {
    id: session.id,
    matchType: session.matchType,
    pacingMode: session.pacingMode,
    wager: session.wager,
    ante: session.ante,
    totalPot: session.totalPot,
    rake: session.rake,
    netPot: session.netPot,
    digits: session.digits,
    sharedAttempts: session.sharedAttempts,
    playerAttempts: session.playerAttempts,
    rivalAttempts: session.rivalAttempts,
    maxAttempts: session.maxAttempts,
    guessClockMs: session.guessClockMs,
    playerClockMs,
    rivalClockMs,
    turnClockSeconds: Math.ceil(playerClockMs / 1000),
    overallClockSeconds: session.overallClockSeconds,
    startedAt: session.startedAt,
    status: session.status,
    winner: session.winner,
    finishTimeDeltaSeconds: session.finishTimeDeltaSeconds,
    player: session.player,
    rival: {
      ...session.rival,
      guesses: safeRivalGuesses,
    },
    currentTurn: session.currentTurn,
    feedEvents: safeFeedEvents,
    ...(isFinished ? { secret: session.secret } : {}),
  };
}

export function syncDuelClocks(duelId: string): DuelSession | undefined {
  let session = mockDuelSessions.get(duelId);
  if (!session) {
    session = createDefaultDuelSession(duelId);
    mockDuelSessions.set(duelId, session);
  }
  if (session.status !== 'active') return toSafeDuelSession(session);

  const now = Date.now();

  if (session.pacingMode === 'simultaneous') {
    // 1. Check player inactivity timeout
    const playerElapsed = now - session.playerLastGuessAt;
    if (playerElapsed >= session.guessClockMs) {
      session.playerAttempts = Math.max(0, session.playerAttempts - 1);
      session.playerLastGuessAt = now;
      session.sharedAttempts = Math.max(0, session.sharedAttempts - 1);
      session.feedEvents.push({
        id: `ev-to-p-${now}`,
        who: 'player',
        guess: null,
        pans: null,
        pots: null,
        timestamp: now - session.startedAt,
        sabotageEvent: {
          toolName: 'CLOCK TIMEOUT',
          description: '35s guess clock expired! 1 attempt burned.',
        },
      });

      if (session.playerAttempts <= 0) {
        session.status = 'rival_won';
        session.winner = 'rival';
        session.finishTimeDeltaSeconds = Math.round((now - session.startedAt) / 1000);
        return toSafeDuelSession(session);
      }
    }

    // 2. Check rival AI reaction
    const rivalElapsed = now - session.rivalLastGuessAt;
    if (session.rivalAttempts > 0 && rivalElapsed >= session.rivalNextGuessDelayMs) {
      const previousRivalGuesses = session.rival.guesses.map((g) => g.guess);
      const rivalGuessStr = generateNullByteGuess(session.digits, previousRivalGuesses, session.secret);
      const rivalScore = calculateScore(session.secret, rivalGuessStr);
      const rivalIsStealth = Math.random() < 0.12;
      const rivalIsUnmasked = rivalIsStealth && !!session.player.snoopActive;
      if (rivalIsUnmasked) {
        session.player.snoopActive = false;
      }

      const rivalRecord: DuelGuessRecord = {
        guess: rivalGuessStr,
        pots: rivalScore.pots,
        pans: rivalScore.pans,
        timestamp: now,
        isStealth: rivalIsStealth,
        unmasked: rivalIsUnmasked,
      };
      session.rival.guesses.push(rivalRecord);
      session.rivalAttempts = Math.max(0, session.rivalAttempts - 1);
      session.rivalLastGuessAt = now;
      session.sharedAttempts = Math.max(0, session.sharedAttempts - 1);
      session.rivalNextGuessDelayMs = Math.floor(Math.random() * 5000) + 4000;

      session.feedEvents.push({
        id: `ev-r-${now}-${Math.random().toString(36).slice(2, 6)}`,
        who: 'rival',
        guess: rivalIsStealth && !rivalIsUnmasked ? null : rivalGuessStr,
        pans: rivalIsStealth && !rivalIsUnmasked ? null : rivalScore.pans,
        pots: rivalIsStealth && !rivalIsUnmasked ? null : rivalScore.pots,
        timestamp: now - session.startedAt,
        isStealth: rivalIsStealth,
        unmasked: rivalIsUnmasked,
      });

      if (rivalScore.pans === session.digits) {
        session.status = 'rival_won';
        session.winner = 'rival';
        session.finishTimeDeltaSeconds = Math.round((now - session.startedAt) / 1000);
      } else if (session.rivalAttempts <= 0) {
        session.status = 'player_won';
        session.winner = 'player';
        session.finishTimeDeltaSeconds = Math.round((now - session.startedAt) / 1000);
      }
    } else if (rivalElapsed >= session.guessClockMs) {
      session.rivalAttempts = Math.max(0, session.rivalAttempts - 1);
      session.rivalLastGuessAt = now;
      session.feedEvents.push({
        id: `ev-to-r-${now}`,
        who: 'rival',
        guess: null,
        pans: null,
        pots: null,
        timestamp: now - session.startedAt,
        sabotageEvent: {
          toolName: 'CLOCK TIMEOUT',
          description: 'Rival turn clock expired (35s)! 1 attempt forfeited.',
        },
      });

      if (session.rivalAttempts <= 0) {
        session.status = 'player_won';
        session.winner = 'player';
        session.finishTimeDeltaSeconds = Math.round((now - session.startedAt) / 1000);
      }
    }
  } else {
    // Turn-based mode
    if (session.currentTurn === 'player') {
      const playerElapsed = now - session.playerLastGuessAt;
      if (playerElapsed >= session.guessClockMs) {
        session.playerAttempts = Math.max(0, session.playerAttempts - 1);
        session.currentTurn = 'rival';
        session.rivalLastGuessAt = now;
        session.playerLastGuessAt = now;
        session.feedEvents.push({
          id: `ev-to-p-${now}`,
          who: 'player',
          guess: null,
          pans: null,
          pots: null,
          timestamp: now - session.startedAt,
          sabotageEvent: {
            toolName: 'TURN TIMEOUT',
            description: 'Turn clock expired (35s)! Turn yielded to opponent.',
          },
        });

        if (session.playerAttempts <= 0) {
          session.status = 'rival_won';
          session.winner = 'rival';
          session.finishTimeDeltaSeconds = Math.round((now - session.startedAt) / 1000);
        }
      }
    } else if (session.currentTurn === 'rival') {
      const rivalElapsed = now - session.rivalLastGuessAt;
      const thinkDelay = Math.max(4000, Math.min(session.rivalNextGuessDelayMs, 6000));
      if (rivalElapsed >= thinkDelay && session.rivalAttempts > 0) {
        const previousRivalGuesses = session.rival.guesses.map((g) => g.guess);
        const rivalGuessStr = generateNullByteGuess(session.digits, previousRivalGuesses, session.secret);
        const rivalScore = calculateScore(session.secret, rivalGuessStr);
        const rivalIsStealth = Math.random() < 0.12;
        const rivalIsUnmasked = rivalIsStealth && !!session.player.snoopActive;
        if (rivalIsUnmasked) {
          session.player.snoopActive = false;
        }

        const rivalRecord: DuelGuessRecord = {
          guess: rivalGuessStr,
          pots: rivalScore.pots,
          pans: rivalScore.pans,
          timestamp: now,
          isStealth: rivalIsStealth,
          unmasked: rivalIsUnmasked,
        };
        session.rival.guesses.push(rivalRecord);
        session.rivalAttempts = Math.max(0, session.rivalAttempts - 1);
        session.rivalLastGuessAt = now;
        session.playerLastGuessAt = now;
        session.currentTurn = 'player';
        session.sharedAttempts = Math.max(0, session.sharedAttempts - 1);

        session.feedEvents.push({
          id: `ev-r-${now}-${Math.random().toString(36).slice(2, 6)}`,
          who: 'rival',
          guess: rivalIsStealth && !rivalIsUnmasked ? null : rivalGuessStr,
          pans: rivalIsStealth && !rivalIsUnmasked ? null : rivalScore.pans,
          pots: rivalIsStealth && !rivalIsUnmasked ? null : rivalScore.pots,
          timestamp: now - session.startedAt,
          isStealth: rivalIsStealth,
          unmasked: rivalIsUnmasked,
        });

        if (rivalScore.pans === session.digits) {
          session.status = 'rival_won';
          session.winner = 'rival';
          session.finishTimeDeltaSeconds = Math.round((now - session.startedAt) / 1000);
        } else if (session.rivalAttempts <= 0) {
          session.status = 'player_won';
          session.winner = 'player';
          session.finishTimeDeltaSeconds = Math.round((now - session.startedAt) / 1000);
        }
      }
    }
  }

  return toSafeDuelSession(session);
}

export function startDuelSession(data: {
  matchType: DuelMatchType;
  pacingMode?: DuelPacingMode;
  wager: number;
  ante?: number;
  roomId?: string;
  playerHandle?: string;
}): DuelSessionState {
  const wager = Math.max(0, data.wager);
  const ante = data.ante ?? (wager > 0 ? Math.floor(wager * 0.1) : 0);
  const totalCost = wager + ante;

  // Validate player credits
  if (mockWallet.credits < totalCost) {
    throw new Error(`Insufficient credits. Required: ${totalCost} CR, Available: ${mockWallet.credits} CR`);
  }

  // Deduct player ante & wager
  if (totalCost > 0) {
    recordTransaction({
      source: `Duel Entry (${data.matchType})`,
      amount: -totalCost,
      currency: 'credits',
      category: 'purchase',
    });
  }

  const potCalc = calculateDuelPot(wager);
  const sessionId = `duel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  // Server-only secret code: 4 digits, no duplicates
  const secret = generateCode(4, false);

  const session: DuelSessionState = {
    id: sessionId,
    matchType: data.matchType,
    pacingMode: data.pacingMode ?? 'simultaneous',
    wager,
    ante,
    totalPot: potCalc.totalPot,
    rake: potCalc.rake,
    netPot: potCalc.netPot,
    secret,
    digits: 4,
    sharedAttempts: 12,
    playerAttempts: 7,
    rivalAttempts: 7,
    maxAttempts: 7,
    guessClockMs: GUESS_CLOCK_MS,
    playerLastGuessAt: Date.now(),
    rivalLastGuessAt: Date.now(),
    rivalNextGuessDelayMs: Math.floor(Math.random() * 5000) + 7000,
    turnClockSeconds: 35,
    overallClockSeconds: 150,
    startedAt: Date.now(),
    status: 'active',
    player: {
      handle: data.playerHandle ?? 'ZERO_COOL',
      avatar: '/Character portraits/Player avatars.png',
      guesses: [],
      activeEffects: [],
      shieldActive: false,
      cheatUsed: false,
      defensiveBuffs: [],
      stealthChargesRemaining: 1,
    },
    rival: {
      handle: 'Null_Byte',
      avatar: '/Character portraits/Null_Byte.png',
      guesses: [],
      activeEffects: [],
      shieldActive: false,
      cheatUsed: false,
      defensiveBuffs: [],
      stealthChargesRemaining: 1,
    },
    currentTurn: 'player',
    feedEvents: [],
  };

  mockDuelSessions.set(sessionId, session);
  return session;
}

export function submitDuelGuess(data: {
  duelId: string;
  guess: string;
  exploitUsed?: string;
  isStealth?: boolean;
}): {
  session: DuelSession;
  playerGuess: DuelGuessRecord;
  rivalGuess?: DuelGuessRecord;
} {
  let session = mockDuelSessions.get(data.duelId);
  if (!session) {
    session = createDefaultDuelSession(data.duelId);
    mockDuelSessions.set(data.duelId, session);
  }
  if (session.status !== 'active') {
    throw new Error('Duel session already resolved');
  }

  // Handle stealth guess
  let actualStealth = false;
  if (data.isStealth) {
    if ((session.player.stealthChargesRemaining ?? 0) > 0) {
      session.player.stealthChargesRemaining = (session.player.stealthChargesRemaining ?? 1) - 1;
      actualStealth = true;
    } else {
      if (mockWallet.credits < STEALTH_GUESS_COST) {
        throw new Error(`Insufficient credits for Stealth Guess. Required: ${STEALTH_GUESS_COST} CR`);
      }
      recordTransaction({
        source: 'Stealth Guess Fee',
        amount: -STEALTH_GUESS_COST,
        currency: 'credits',
        category: 'purchase',
      });
      actualStealth = true;
    }
  }

  // Check key latch virus guard
  if (session.player.latchedKeys && session.player.latchedKeys.length > 0) {
    const latched = session.player.latchedKeys.find((k: string) => data.guess.includes(k));
    if (latched) {
      throw new Error(`Key [${latched}] is latched by virus! Cannot submit guess.`);
    }
    // Latch expires after submitting valid guess
    session.player.latchedKeys = undefined;
    session.player.activeEffects = session.player.activeEffects.filter((e) => e !== 'key_latch');
  }

  // Check logic bomb tripwire
  if (session.player.activeLogicBomb && data.guess.includes(session.player.activeLogicBomb.targetDigit)) {
    const trappedDigit = session.player.activeLogicBomb.targetDigit;
    session.playerAttempts = Math.max(0, session.playerAttempts - 1);
    session.turnClockSeconds = Math.max(0, session.turnClockSeconds - 5);
    session.player.activeLogicBomb = undefined;
    session.player.activeEffects = session.player.activeEffects.filter((e) => e !== 'logic_bomb');
    session.feedEvents.push({
      id: `ev-bomb-${Date.now()}`,
      who: 'rival',
      guess: null,
      pans: null,
      pots: null,
      timestamp: Date.now() - session.startedAt,
      sabotageEvent: {
        toolName: 'Logic Bomb Detonation',
        description: `Opponent's Logic Bomb on digit [${trappedDigit}] detonated! -1 attempt, -5s lost.`,
      },
    });
  }

  // Check exploit
  if (data.exploitUsed) {
    const check = isExploitAllowed(session.matchType);
    if (!check.allowed) {
      throw new Error(check.reason || 'Exploits are disabled in ranked duels.');
    }
    session.player.cheatUsed = true;
  }

  // Clear scrambled keypad after guess
  session.player.activeEffects = session.player.activeEffects.filter(e => e !== 'scramble_keypad');

  // Check if static history expired
  if (session.player.staticExpiry && Date.now() > session.player.staticExpiry) {
    session.player.activeEffects = session.player.activeEffects.filter(e => e !== 'static_history');
    session.player.staticExpiry = undefined;
  }

  // Score player guess
  const playerScore = calculateScore(session.secret, data.guess);

  let displayPots = playerScore.pots;
  let displayPans = playerScore.pans;
  let wasFalsified = false;

  // Parity jammer check
  let parityLabel: 'EVEN' | 'ODD' | undefined;
  if (session.player.parityJamActive || session.player.activeEffects.includes('parity_jam')) {
    const hits = playerScore.pans + playerScore.pots;
    parityLabel = hits % 2 === 0 ? 'EVEN' : 'ODD';
    session.player.parityJamActive = false;
    session.player.activeEffects = session.player.activeEffects.filter((e) => e !== 'parity_jam');
  }

  // False Flag Echo: spoof public feedback for this guess
  if (session.player.falseFlagActive) {
    const fake = generateFalseFlagClue(playerScore.pots, playerScore.pans, session.digits);
    displayPots = fake.pots;
    displayPans = fake.pans;
    wasFalsified = true;
    session.player.falseFlagActive = false;
  }

  if (session.pacingMode === 'turn_based' && session.currentTurn !== 'player') {
    throw new Error('Not your turn. Rival is currently calculating.');
  }

  const isStealth = actualStealth;
  const isUnmasked = isStealth && !!session.rival.snoopActive;
  if (isUnmasked) {
    session.rival.snoopActive = false;
  }

  const playerRecord: DuelGuessRecord = {
    guess: data.guess,
    pots: displayPots,
    pans: displayPans,
    timestamp: Date.now(),
    cheatUsed: session.player.cheatUsed,
    isStealth,
    falsified: wasFalsified,
    unmasked: isUnmasked,
    parityLabel,
  };
  session.player.guesses.push(playerRecord);
  session.playerAttempts = Math.max(0, session.playerAttempts - 1);
  session.playerLastGuessAt = Date.now();
  session.sharedAttempts = Math.max(0, session.sharedAttempts - 1);

  // Add player guess to unified feed
  session.feedEvents.push({
    id: `ev-p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    who: 'player',
    guess: data.guess,
    pans: displayPans,
    pots: displayPots,
    timestamp: Date.now() - session.startedAt,
    isStealth,
    unmasked: isUnmasked,
    cheatUsed: session.player.cheatUsed,
    falsified: wasFalsified,
  });

  // Check player win
  if (playerScore.pans === session.digits) {
    session.status = 'player_won';
    session.winner = 'player';
    session.finishTimeDeltaSeconds = Math.round((Date.now() - session.startedAt) / 1000);

    // Award net pot
    if (session.netPot > 0) {
      recordTransaction({
        source: `Duel Victory (${session.matchType})`,
        amount: session.netPot,
        currency: 'credits',
        category: 'payout',
      });
    }

    return {
      session: toSafeDuelSession(session),
      playerGuess: playerRecord,
    };
  }

  // Check player attempts exhausted
  if (session.playerAttempts <= 0) {
    session.status = 'rival_won';
    session.winner = 'rival';
    return {
      session: toSafeDuelSession(session),
      playerGuess: playerRecord,
    };
  }

  // Rival (Null_Byte AI) reacts with intelligent guess
  let rivalRecord: DuelGuessRecord | undefined;
  if (session.rivalAttempts > 0) {
    const previousRivalGuesses = session.rival.guesses.map(g => g.guess);
    const rivalGuessStr = generateNullByteGuess(session.digits, previousRivalGuesses, session.secret);
    const rivalScore = calculateScore(session.secret, rivalGuessStr);
    const rivalIsStealth = Math.random() < 0.12; // 1 in 8 stealth
    const rivalIsUnmasked = rivalIsStealth && !!session.player.snoopActive;
    if (rivalIsUnmasked) {
      session.player.snoopActive = false;
    }

    rivalRecord = {
      guess: rivalGuessStr,
      pots: rivalScore.pots,
      pans: rivalScore.pans,
      timestamp: Date.now() + 250,
      isStealth: rivalIsStealth,
      unmasked: rivalIsUnmasked,
    };
    session.rival.guesses.push(rivalRecord);
    session.rivalAttempts = Math.max(0, session.rivalAttempts - 1);
    session.rivalLastGuessAt = Date.now() + 250;
    session.sharedAttempts = Math.max(0, session.sharedAttempts - 1);
    session.rivalNextGuessDelayMs = Math.floor(Math.random() * 5000) + 4000;

    session.feedEvents.push({
      id: `ev-r-${Date.now() + 250}-${Math.random().toString(36).slice(2, 6)}`,
      who: 'rival',
      guess: rivalIsStealth && !rivalIsUnmasked ? null : rivalGuessStr,
      pans: rivalIsStealth && !rivalIsUnmasked ? null : rivalScore.pans,
      pots: rivalIsStealth && !rivalIsUnmasked ? null : rivalScore.pots,
      timestamp: (Date.now() + 250) - session.startedAt,
      isStealth: rivalIsStealth,
      unmasked: rivalIsUnmasked,
    });

    // Check rival win
    if (rivalScore.pans === session.digits) {
      session.status = 'rival_won';
      session.winner = 'rival';
      session.finishTimeDeltaSeconds = Math.round((Date.now() - session.startedAt) / 1000);
      return {
        session: toSafeDuelSession(session),
        playerGuess: playerRecord,
        rivalGuess: rivalRecord,
      };
    }

    if (session.rivalAttempts <= 0) {
      session.status = 'player_won';
      session.winner = 'player';
      return {
        session: toSafeDuelSession(session),
        playerGuess: playerRecord,
        rivalGuess: rivalRecord,
      };
    }
  }

  if (session.pacingMode === 'turn_based') {
    session.currentTurn = 'player';
    session.playerLastGuessAt = Date.now();
  }

  // Occasional rival counter-sabotage on turn 2+ (25% chance)
  if (session.player.guesses.length >= 2 && Math.random() < 0.25) {
    if (session.player.shieldActive) {
      session.player.shieldActive = false; // Shield absorbed!
      session.feedEvents.push({
        id: `ev-sab-r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        who: 'rival',
        guess: null,
        pans: null,
        pots: null,
        timestamp: Date.now() - session.startedAt,
        sabotageEvent: {
          toolName: 'Rival Counter-Attack',
          description: "Opponent's attack was absorbed by your Firewall Shield!",
        },
      });
    } else {
      const sabotageTypes: Array<'scramble_keypad' | 'static_history' | 'drain_clock'> = [
        'scramble_keypad',
        'static_history',
        'drain_clock',
      ];
      const effect = sabotageTypes[Math.floor(Math.random() * sabotageTypes.length)];
      if (!session.player.activeEffects.includes(effect)) {
        session.player.activeEffects.push(effect);
        let desc = 'Opponent disrupted your systems.';
        if (effect === 'static_history') {
          session.player.staticExpiry = Date.now() + 6000;
          desc = 'Opponent injected Static Glitch into your crack history (6s).';
        } else if (effect === 'drain_clock') {
          session.turnClockSeconds = Math.max(5, session.turnClockSeconds - 10);
          session.playerLastGuessAt -= 10000;
          desc = 'Opponent deployed EMP Drain: 10s stripped from your turn clock!';
        } else if (effect === 'scramble_keypad') {
          desc = 'Opponent injected Buffer Scramble into your numeric keypad!';
        }
        session.feedEvents.push({
          id: `ev-sab-r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          who: 'rival',
          guess: null,
          pans: null,
          pots: null,
          timestamp: Date.now() - session.startedAt,
          sabotageEvent: {
            toolName: 'Rival Sabotage',
            description: desc,
          },
        });
      }
    }
  }

  return {
    session: toSafeDuelSession(session),
    playerGuess: playerRecord,
    rivalGuess: rivalRecord,
  };
}

export function applyDuelSabotage(data: {
  duelId: string;
  toolId: string;
}): {
  success: boolean;
  shielded: boolean;
  effectApplied?: string;
  remainingCredits: number;
  message: string;
} {
  let session = mockDuelSessions.get(data.duelId);
  if (!session) {
    session = createDefaultDuelSession(data.duelId);
    mockDuelSessions.set(data.duelId, session);
  }
  if (session.status !== 'active') throw new Error('Duel already ended');

  const normId = normalizeSabotageToolId(data.toolId);
  const rule = (normId in SABOTAGE_TOOL_CATALOG ? SABOTAGE_TOOL_CATALOG[normId as keyof typeof SABOTAGE_TOOL_CATALOG] : undefined) ||
    (data.toolId in SABOTAGE_RULES ? SABOTAGE_RULES[data.toolId as keyof typeof SABOTAGE_RULES] : undefined);
  if (!rule) throw new Error('Unknown sabotage tool');

  if (mockWallet.credits < rule.creditCost) {
    throw new Error(`Insufficient credits for ${rule.name}. Required: ${rule.creditCost} CR`);
  }

  // Deduct cost
  recordTransaction({
    source: `Sabotage (${rule.name})`,
    amount: -rule.creditCost,
    currency: 'credits',
    category: 'purchase',
  });

  // 1. Priming defensive buffs (Firewall Patch / Mirror Daemon)
  if (rule.isDefensive || rule.effectType === 'firewall_shield' || rule.effectType === 'mirror_shield') {
    session.player.shieldActive = true;
    session.player.defensiveBuffs = session.player.defensiveBuffs || [];
    session.player.defensiveBuffs.push({
      type: normId === 'mirror_daemon' ? 'mirror_daemon' : 'firewall_patch',
      sourceDeckerId: 'player',
      timestamp: Date.now(),
    });
    session.feedEvents.push({
      id: `ev-sab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      who: 'player',
      guess: null,
      pans: null,
      pots: null,
      timestamp: Date.now() - session.startedAt,
      sabotageEvent: {
        toolName: rule.name,
        description: `${rule.name} primed on your rig deck.`,
      },
    });
    return {
      success: true,
      shielded: false,
      effectApplied: rule.effectType,
      remainingCredits: mockWallet.credits,
      message: `${rule.name} primed on your deck!`,
    };
  }

  // 2. Utility self-effects
  if (rule.effectType === 'snoop_packet') {
    session.player.snoopActive = true;
    session.rival.guesses.forEach((g) => {
      if (g.isStealth) g.unmasked = true;
    });
    session.feedEvents.push({
      id: `ev-sab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      who: 'player',
      guess: null,
      pans: null,
      pots: null,
      timestamp: Date.now() - session.startedAt,
      sabotageEvent: {
        toolName: rule.name,
        description: 'Packet Sniffer deployed: opponent encrypted moves unmasked.',
      },
    });
    return {
      success: true,
      shielded: false,
      effectApplied: 'snoop_packet',
      remainingCredits: mockWallet.credits,
      message: 'Packet Sniffer active. Opponent moves unmasked.',
    };
  }

  if (rule.effectType === 'false_flag_echo') {
    session.player.falseFlagActive = true;
    session.feedEvents.push({
      id: `ev-sab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      who: 'player',
      guess: null,
      pans: null,
      pots: null,
      timestamp: Date.now() - session.startedAt,
      sabotageEvent: {
        toolName: rule.name,
        description: 'Echo Decoy armed: next guess broadcasts falsified clues.',
      },
    });
    return {
      success: true,
      shielded: false,
      effectApplied: 'false_flag_echo',
      remainingCredits: mockWallet.credits,
      message: 'Echo Decoy armed. Next guess broadcasts spoofed Pan/Pot counts.',
    };
  }

  // 3. Offensive attack against opponent: evaluate opponent's defensiveBuffs in LIFO order
  const rivalDefense = session.rival.defensiveBuffs?.pop();
  if (rivalDefense?.type === 'mirror_daemon') {
    session.rival.shieldActive = (session.rival.defensiveBuffs?.length ?? 0) > 0;
    // Reflect 50% back to player
    if (normId === 'clock_drainer') {
      session.playerLastGuessAt -= 4000;
      session.turnClockSeconds = Math.max(0, session.turnClockSeconds - 4);
    } else if (normId === 'key_latch_virus') {
      session.player.latchedKeys = ['7'];
      session.player.activeEffects.push('key_latch');
    } else if (normId === 'parity_jammer') {
      session.player.parityJamActive = true;
      session.player.activeEffects.push('parity_jam');
    }
    session.feedEvents.push({
      id: `ev-sab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      who: 'player',
      guess: null,
      pans: null,
      pots: null,
      timestamp: Date.now() - session.startedAt,
      sabotageEvent: {
        toolName: rule.name,
        description: `Opponent's Mirror Daemon deflected ${rule.name} and reflected 50% back!`,
      },
    });
    return {
      success: true,
      shielded: true,
      effectApplied: rule.effectType,
      remainingCredits: mockWallet.credits,
      message: `Opponent's Mirror Daemon reflected ${rule.name} back at you!`,
    };
  }

  if (rivalDefense?.type === 'firewall_patch' || session.rival.shieldActive) {
    session.rival.shieldActive = (session.rival.defensiveBuffs?.length ?? 0) > 0;
    session.feedEvents.push({
      id: `ev-sab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      who: 'player',
      guess: null,
      pans: null,
      pots: null,
      timestamp: Date.now() - session.startedAt,
      sabotageEvent: {
        toolName: rule.name,
        description: `Opponent's Firewall Patch absorbed your ${rule.name}!`,
      },
    });
    return {
      success: true,
      shielded: true,
      effectApplied: rule.effectType,
      remainingCredits: mockWallet.credits,
      message: `Opponent's Firewall Patch absorbed the attack!`,
    };
  }

  // 4. Apply offensive effect to rival
  if (normId === 'clock_drainer') {
    session.rival.activeEffects.push('drain_clock');
    session.rivalLastGuessAt -= 8000;
  } else if (normId === 'parity_jammer') {
    session.rival.activeEffects.push('parity_jam');
    session.rival.parityJamActive = true;
  } else if (normId === 'key_latch_virus') {
    session.rival.activeEffects.push('key_latch');
    const allDigits = '0123456789'.split('');
    const nonWinning = allDigits.filter((d) => !session.secret.includes(d));
    session.rival.latchedKeys = nonWinning.slice(0, 2);
  } else if (normId === 'logic_bomb') {
    session.rival.activeEffects.push('logic_bomb');
    session.rival.activeLogicBomb = { targetDigit: '3', armedBy: 'player', sourceDeckerId: 'player' };
  } else if (normId === 'static_injector' || rule.effectType === 'static_history') {
    session.rival.activeEffects.push('static_history');
    session.rival.staticExpiry = Date.now() + 6000;
  } else if (rule.effectType === 'scramble_keypad') {
    session.rival.activeEffects.push('scramble_keypad');
  }

  session.feedEvents.push({
    id: `ev-sab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    who: 'player',
    guess: null,
    pans: null,
    pots: null,
    timestamp: Date.now() - session.startedAt,
    sabotageEvent: {
      toolName: rule.name,
      description: `${rule.name} deployed against opponent!`,
    },
  });

  return {
    success: true,
    shielded: false,
    effectApplied: rule.effectType,
    remainingCredits: mockWallet.credits,
    message: `${rule.name} successfully deployed against opponent!`,
  };
}

export function triggerDoubleOrNothing(duelId: string): DuelSessionState {
  let session = mockDuelSessions.get(duelId);
  if (!session) {
    session = createDefaultDuelSession(duelId);
    session.status = 'player_won';
    mockDuelSessions.set(duelId, session);
  }
  if (session.status !== 'player_won') {
    throw new Error('Double or Nothing can only be triggered after victory');
  }

  const donCalc = calculateDoubleOrNothing(session.netPot);
  const secret = generateCode(4, false);

  const rematchedSession: DuelSessionState = {
    id: `duel-don-${Date.now().toString(36)}`,
    matchType: session.matchType,
    pacingMode: session.pacingMode,
    wager: session.netPot,
    ante: 0,
    totalPot: donCalc.totalPot,
    rake: donCalc.rake,
    netPot: donCalc.netPot,
    secret,
    digits: 4,
    sharedAttempts: 12,
    playerAttempts: 7,
    rivalAttempts: 7,
    maxAttempts: 7,
    guessClockMs: GUESS_CLOCK_MS,
    playerLastGuessAt: Date.now(),
    rivalLastGuessAt: Date.now(),
    rivalNextGuessDelayMs: 4000,
    turnClockSeconds: 20,
    overallClockSeconds: 90,
    startedAt: Date.now(),
    status: 'active',
    player: {
      handle: session.player.handle,
      avatar: session.player.avatar,
      guesses: [],
      activeEffects: [],
      shieldActive: false,
      cheatUsed: false,
    },
    rival: {
      handle: 'Null_Byte',
      avatar: '/Character portraits/Null_Byte.png',
      guesses: [],
      activeEffects: [],
      shieldActive: false,
      cheatUsed: false,
    },
    currentTurn: 'player',
    feedEvents: [],
  };

  mockDuelSessions.set(rematchedSession.id, rematchedSession);
  return rematchedSession;
}

/**
 * ============================================================================
 * CO-OP HEIST MULTIPLAYER MOCK STATE & LOGIC
 * ============================================================================
 */

export interface CoopStageServerState extends CoopStageConfig {
  secret: string; // SERVER ONLY!
  completed: boolean;
}

export interface CoopSessionState {
  id: string;
  status: 'active' | 'won' | 'lost';
  startedAt: number;
  timeLimitSeconds: number;
  bounty: number;
  mode?: '3-stage' | 'legacy';
  playerRole?: 'ALPHA' | 'BRAVO';
  isBotPartner?: boolean;
  partnerCallsign?: string;
  partnerAction?: string;
  latestTelemetryEvent?: CoopTelemetryEvent;
  heistState?: CoopHeistState;
  heistSecrets?: CoopHeistSecrets;
  alpha: {
    secret: string; // SERVER ONLY!
    digits: number;
    attemptsLeft: number;
    maxAttempts: number;
    guesses: CoopGuessRecord[];
    eliminatedDigits: string[];
  };
  beta: {
    currentStageIndex: number;
    stages: CoopStageServerState[];
    guesses: CoopGuessRecord[];
  };
  payout?: CoopPayoutResult;
}

const globalForCoop = global as unknown as {
  mockCoopSessions?: Map<string, CoopSessionState>;
};

export const mockCoopSessions = globalForCoop.mockCoopSessions || new Map<string, CoopSessionState>();

if (process.env.NODE_ENV !== 'production') {
  globalForCoop.mockCoopSessions = mockCoopSessions;
}

export function getSafeCoopSession(session: CoopSessionState) {
  const isFinished = session.status !== 'active';

  let safeHeist: any = undefined;
  if (session.heistState && session.heistSecrets) {
    const s1AlphaSolved = session.heistState.stage1.alpha.solved;
    const s1BravoSolved = session.heistState.stage1.bravo.solved;
    const s2Solved = session.heistState.stage2.solved;
    const s3Solved = session.heistState.stage3.solved;

    safeHeist = {
      ...session.heistState,
      stage1: {
        ...session.heistState.stage1,
        alpha: {
          ...session.heistState.stage1.alpha,
          secret: (isFinished || s1AlphaSolved) ? session.heistSecrets.alphaStage1Code : undefined,
        },
        bravo: {
          ...session.heistState.stage1.bravo,
          secret: (isFinished || s1BravoSolved) ? session.heistSecrets.bravoStage1Code : undefined,
        },
      },
      stage2: {
        ...session.heistState.stage2,
        secret: (isFinished || s2Solved) ? session.heistSecrets.stage2Code : undefined,
      },
      stage3: {
        ...session.heistState.stage3,
        secret: (isFinished || s3Solved) ? session.heistSecrets.stage3Code : undefined,
      },
      playerRole: session.playerRole || 'BRAVO',
      partnerCallsign: session.partnerCallsign || (session.playerRole === 'ALPHA' ? 'BRAVO // GLITCH (AI)' : 'ALPHA // NIX (AI)'),
      partnerAction: session.partnerAction || 'Carrier link active',
      isBotPartner: session.isBotPartner ?? true,
      latestTelemetryEvent: session.latestTelemetryEvent,
      nixCallout: session.latestTelemetryEvent
        ? getNixCoopCallout(session.latestTelemetryEvent, session.playerRole || 'BRAVO')
        : null,
    };
  }

  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt,
    timeLimitSeconds: session.timeLimitSeconds,
    bounty: session.bounty,
    payout: session.payout || session.heistState?.payout,
    mode: session.mode,
    alpha: {
      digits: session.alpha.digits,
      attemptsLeft: session.alpha.attemptsLeft,
      maxAttempts: session.alpha.maxAttempts,
      guesses: session.alpha.guesses,
      eliminatedDigits: session.alpha.eliminatedDigits,
      // RULE 1: Secret only returned after victory/defeat
      secret: isFinished ? session.alpha.secret : undefined,
    },
    beta: {
      currentStageIndex: session.beta.currentStageIndex,
      guesses: session.beta.guesses,
      stages: session.beta.stages.map((st) => ({
        id: st.id,
        name: st.name,
        digits: st.digits,
        rewardType: st.rewardType,
        rewardDescription: st.rewardDescription,
        completed: st.completed,
        // RULE 1: Secret only returned after stage is completed or heist finished
        secret: (isFinished || st.completed) ? st.secret : undefined,
      })),
    },
    heist: safeHeist,
  };
}

export function startCoopSession(options?: {
  playerRole?: CoopRole;
  difficulty?: number;
  initialAlphaSecret?: string;
  initialBetaSecrets?: string[];
  isBotPartner?: boolean;
  stage2Ice?: IceType;
  mode?: '3-stage' | 'legacy';
  bounty?: number;
}): CoopSessionState {
  const sessionId = `coop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const role = options?.playerRole ? normalizeCoopRole(options.playerRole) : 'BRAVO';
  const mode = options?.mode || (options?.initialAlphaSecret && options.initialAlphaSecret.length === 4 ? 'legacy' : '3-stage');
  const isBotPartner = options?.isBotPartner ?? true;

  // Legacy state
  const alphaSecret = options?.initialAlphaSecret || generateCode(4, false);
  const stages: CoopStageServerState[] = COOP_STAGE_TEMPLATES.map((tmpl, idx) => ({
    ...tmpl,
    secret: (options?.initialBetaSecrets && options.initialBetaSecrets[idx]) || generateCode(tmpl.digits, false),
    completed: false,
  }));

  // 3-Stage Heist state
  const { state: heistState, secrets: heistSecrets } = createCoopHeistState({
    id: sessionId,
    bounty: options?.bounty ?? 5000,
    stage2Ice: options?.stage2Ice ?? 'Liar',
    initialSecrets: {
      alphaStage1Code: (options?.initialBetaSecrets && options.initialBetaSecrets[0]?.length === 3)
        ? options.initialBetaSecrets[0]
        : undefined,
      bravoStage1Code: (options?.initialBetaSecrets && options.initialBetaSecrets[1]?.length === 3)
        ? options.initialBetaSecrets[1]
        : undefined,
    },
  });

  const session: CoopSessionState = {
    id: sessionId,
    status: 'active',
    startedAt: Date.now(),
    timeLimitSeconds: 180,
    bounty: options?.bounty ?? 5000,
    mode,
    playerRole: role,
    isBotPartner,
    partnerCallsign: role === 'ALPHA' ? 'BRAVO // GLITCH (AI)' : 'ALPHA // NIX (AI)',
    partnerAction: 'Carrier link established. Awaiting synchronized handshake.',
    alpha: {
      secret: alphaSecret,
      digits: 4,
      attemptsLeft: 4,
      maxAttempts: 4,
      guesses: [],
      eliminatedDigits: [],
    },
    beta: {
      currentStageIndex: 0,
      stages,
      guesses: [],
    },
    heistState,
    heistSecrets,
  };

  mockCoopSessions.set(sessionId, session);
  return session;
}

export function submitCoopGuess(data: {
  sessionId: string;
  role: CoopRole;
  guess: string;
}): {
  session: ReturnType<typeof getSafeCoopSession>;
  guessRecord: CoopGuessRecord;
  rewardMessage?: string;
  event?: CoopTelemetryEvent;
} {
  const session = mockCoopSessions.get(data.sessionId);
  if (!session) throw new Error('Co-op session not found');
  if (session.status !== 'active') throw new Error('Co-op session is no longer active');

  const normalizedRole = normalizeCoopRole(data.role);

  // 3-Stage Heist Path
  if (session.mode === '3-stage' && session.heistState && session.heistSecrets) {
    const stage = session.heistState.currentStage;
    let rec: CoopGuessRecord;
    let rewardMessage: string | undefined;
    let event: CoopTelemetryEvent | undefined;

    if (stage === 1) {
      const outcome = submitStage1Guess(session.heistState, session.heistSecrets, normalizedRole, data.guess);
      rec = outcome.result;
      rewardMessage = outcome.message;
      event = outcome.event;
      session.latestTelemetryEvent = event;

      // Automated Nix Bot Partner response for Stage 1
      if (session.isBotPartner) {
        if (session.heistState.stage1.firstCrackedBy === normalizedRole && outcome.event?.type === 'STAGE1_PARTNER_WAITING') {
          // Bot cracks partner lock within the 8s sync window!
          const botRole = normalizedRole === 'ALPHA' ? 'BRAVO' : 'ALPHA';
          const botSecret = botRole === 'ALPHA' ? session.heistSecrets.alphaStage1Code : session.heistSecrets.bravoStage1Code;
          const botOutcome = submitStage1Guess(session.heistState, session.heistSecrets, botRole, botSecret);
          session.latestTelemetryEvent = botOutcome.event;
          event = botOutcome.event;
          rewardMessage = botOutcome.message;
          session.partnerAction = 'SYNC CONFIRMED! Dual-key handshake bypassed.';
        } else {
          session.partnerAction = 'Scanning 3-digit perimeter frequency band...';
        }
      }
    } else if (stage === 2) {
      if (normalizedRole === 'BRAVO') {
        const outcome = submitStage2Guess(session.heistState, session.heistSecrets, data.guess);
        rec = outcome.result;
        rewardMessage = outcome.message;
        event = outcome.event;
        session.latestTelemetryEvent = event;

        // Bot (Alpha) automatic support in Stage 2
        if (session.isBotPartner && session.heistState.currentStage === 2) {
          if (outcome.event?.type === 'STAGE2_ICE_DETECTED' && session.heistState.stage2.reconChargesRemaining > 0) {
            flushIceStage2(session.heistState);
            session.latestTelemetryEvent = {
              type: 'STAGE2_ICE_FLUSHED',
              stage: 2,
              actorRole: 'ALPHA',
              targetRole: 'BRAVO',
              message: 'Nix Bot flushed carrier line! ICE distortion purged.',
            };
            session.partnerAction = 'FLUSHED ACTIVE ICE: Bravo telemetry restored.';
          } else if (session.heistState.stage2.reconChargesRemaining > 0) {
            // Ping an un-scanned digit
            const unScanned = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
              (d) => session.heistState!.stage2.pingedDigits[d] === undefined
            );
            if (unScanned.length > 0) {
              const pingResult = pingDigitStage2(session.heistState, session.heistSecrets, unScanned[0]);
              session.latestTelemetryEvent = pingResult.event;
              session.partnerAction = `Carrier scan: Digit [${unScanned[0]}] ${pingResult.status}.`;
            }
          }
        }
      } else {
        throw new Error('Alpha cannot submit direct guesses in Stage 2. Use [PING DIGIT] or [FLUSH ICE]!');
      }
    } else {
      // Stage 3: Master Vault
      const outcome = submitStage3Guess(session.heistState, session.heistSecrets, normalizedRole, data.guess);
      rec = outcome.result;
      rewardMessage = outcome.message;
      event = outcome.event;
      session.latestTelemetryEvent = event;

      if (session.heistState.status === 'WON' && session.heistState.payout) {
        session.status = 'won';
        session.payout = session.heistState.payout;
        recordTransaction({
          source: 'Co-op Core Vault Payout',
          amount: session.heistState.payout.eachPlayerShare,
          currency: 'credits',
          category: 'payout',
        });
      } else if (session.heistState.status === 'LOST') {
        session.status = 'lost';
      } else if (session.isBotPartner && session.heistState.stage3.activeTurn !== normalizedRole) {
        // Bot takes alternating turn
        const botRole = normalizedRole === 'ALPHA' ? 'BRAVO' : 'ALPHA';
        const botGuess = generateCode(5, false);
        const botOutcome = submitStage3Guess(session.heistState, session.heistSecrets, botRole, botGuess);
        session.latestTelemetryEvent = botOutcome.event;
        session.partnerAction = `Injected probe: ${botGuess} [${botOutcome.result.pans} Pan, ${botOutcome.result.pots} Pot]`;
      }
    }

    return {
      session: getSafeCoopSession(session),
      guessRecord: rec!,
      rewardMessage,
      event,
    };
  }

  // Legacy Co-op Heist Path
  const isValid = validateCoopGuess(data.role, data.guess);
  if (!isValid) throw new Error(`Invalid guess format for role ${data.role}`);

  const elapsed = (Date.now() - session.startedAt) / 1000;
  if (elapsed >= session.timeLimitSeconds) {
    session.status = 'lost';
    return {
      session: getSafeCoopSession(session),
      guessRecord: { guess: data.guess, pots: 0, pans: 0, timestamp: Date.now(), role: data.role },
      rewardMessage: 'MISSION FAILED: Security countdown expired.',
    };
  }

  let rewardMessage: string | undefined;

  if (data.role === 'alpha') {
    const score = calculateScore(session.alpha.secret, data.guess);
    const rec: CoopGuessRecord = {
      guess: data.guess,
      pots: score.pots,
      pans: score.pans,
      timestamp: Date.now(),
      role: 'alpha',
    };
    session.alpha.guesses.push(rec);

    if (score.pans === session.alpha.digits) {
      session.status = 'won';
      const remainingSecs = Math.max(0, session.timeLimitSeconds - elapsed);
      const stagesCompleted = session.beta.stages.filter((s) => s.completed).length;
      const payout = calculateCoopPayout({
        baseBounty: session.bounty,
        remainingSeconds: remainingSecs,
        totalSeconds: session.timeLimitSeconds,
        stagesCompleted,
      });
      session.payout = payout;

      recordTransaction({
        source: 'Co-op Vault Breach Payout',
        amount: payout.eachPlayerShare,
        currency: 'credits',
        category: 'payout',
      });

      rewardMessage = `VAULT CRACKED! Master signal unlocked by Alpha Infiltrator. Crew dividend of ${payout.eachPlayerShare} CR secured.`;
      return {
        session: getSafeCoopSession(session),
        guessRecord: rec,
        rewardMessage,
      };
    }

    session.alpha.attemptsLeft -= 1;
    if (session.alpha.attemptsLeft <= 0) {
      session.status = 'lost';
      rewardMessage = 'MISSION FAILED // Alpha exhausted all guess attempts.';
    }

    return {
      session: getSafeCoopSession(session),
      guessRecord: rec,
      rewardMessage,
    };
  } else {
    // Role Beta
    const stage = session.beta.stages[session.beta.currentStageIndex];
    if (!stage || stage.completed) {
      throw new Error('All auxiliary subroutines already bypassed');
    }

    const score = calculateScore(stage.secret, data.guess);
    const rec: CoopGuessRecord = {
      guess: data.guess,
      pots: score.pots,
      pans: score.pans,
      timestamp: Date.now(),
      role: 'beta',
    };
    session.beta.guesses.push(rec);

    if (score.pans === stage.digits) {
      stage.completed = true;
      const reward = calculateCoopReward(stage, {
        alphaAttempts: session.alpha.attemptsLeft,
        alphaSecret: session.alpha.secret,
        eliminatedDigits: session.alpha.eliminatedDigits,
        remainingSeconds: Math.max(0, session.timeLimitSeconds - elapsed),
      });

      session.alpha.attemptsLeft = reward.nextAttempts;
      session.alpha.eliminatedDigits = reward.eliminatedDigits;
      if (reward.addedSeconds) {
        session.timeLimitSeconds += reward.addedSeconds;
      }

      if (reward.type === 'extra_attempt') {
        rewardMessage = `[BETA SUPPORT] ${stage.name} CRACKED! +1 Attempt granted to Alpha.`;
      } else if (reward.type === 'remove_dead_digit') {
        rewardMessage = `[BETA SUPPORT] ${stage.name} CRACKED! Dead digit '${reward.eliminatedDigit}' eliminated for Alpha.`;
      } else if (reward.type === 'time_freeze') {
        rewardMessage = `[BETA SUPPORT] ${stage.name} CRACKED! +${reward.addedSeconds}s added to crew timer.`;
      }

      if (session.beta.currentStageIndex < session.beta.stages.length - 1) {
        session.beta.currentStageIndex += 1;
      } else {
        rewardMessage = (rewardMessage ? rewardMessage + ' ' : '') + '[BETA SUPPORT] All security firewalls bypassed! Alpha has full signal support.';
      }
    }

    return {
      session: getSafeCoopSession(session),
      guessRecord: rec,
      rewardMessage,
    };
  }
}

export function pingCoopDigit(sessionId: string, digit: number) {
  const session = mockCoopSessions.get(sessionId);
  if (!session || !session.heistState || !session.heistSecrets) {
    throw new Error('3-Stage Co-op heist session not found');
  }

  const result = pingDigitStage2(session.heistState, session.heistSecrets, digit);
  session.latestTelemetryEvent = result.event;
  session.partnerAction = result.message;

  return {
    session: getSafeCoopSession(session),
    status: result.status,
    message: result.message,
    event: result.event,
  };
}

export function flushCoopIce(sessionId: string) {
  const session = mockCoopSessions.get(sessionId);
  if (!session || !session.heistState) {
    throw new Error('3-Stage Co-op heist session not found');
  }

  const result = flushIceStage2(session.heistState);
  session.latestTelemetryEvent = result.event;
  session.partnerAction = result.message;

  return {
    session: getSafeCoopSession(session),
    message: result.message,
    event: result.event,
  };
}

export function triggerCoopOverdrive(sessionId: string) {
  const session = mockCoopSessions.get(sessionId);
  if (!session || !session.heistState) {
    throw new Error('3-Stage Co-op heist session not found');
  }

  const result = triggerOverdriveStage3(session.heistState);
  session.latestTelemetryEvent = result.event;
  session.partnerAction = result.message;

  return {
    session: getSafeCoopSession(session),
    message: result.message,
    event: result.event,
  };
}

export function tickCoopSync(sessionId: string, deltaMs: number) {
  const session = mockCoopSessions.get(sessionId);
  if (!session || !session.heistState || !session.heistSecrets) {
    return null;
  }

  const result = checkStage1SyncTimeout(session.heistState, session.heistSecrets, deltaMs);
  if (result.reset && result.event) {
    session.latestTelemetryEvent = result.event;
    session.partnerAction = 'Sync window timed out! Outer locks rotated.';
  }

  return {
    session: getSafeCoopSession(session),
    reset: result.reset,
    event: result.event,
  };
}

export function simulatePartnerBetaStage(sessionId: string): {
  session: ReturnType<typeof getSafeCoopSession>;
  guessRecord: CoopGuessRecord;
  rewardMessage?: string;
} {
  const session = mockCoopSessions.get(sessionId);
  if (!session) throw new Error('Co-op session not found');

  if (session.mode === '3-stage' && session.heistState && session.heistSecrets) {
    const stage = session.heistState.currentStage;
    if (stage === 1) {
      const botRole = session.playerRole === 'ALPHA' ? 'BRAVO' : 'ALPHA';
      const secret = botRole === 'ALPHA' ? session.heistSecrets.alphaStage1Code : session.heistSecrets.bravoStage1Code;
      return submitCoopGuess({ sessionId, role: botRole, guess: secret });
    } else if (stage === 2) {
      return submitCoopGuess({ sessionId, role: 'BRAVO', guess: session.heistSecrets.stage2Code });
    } else {
      return submitCoopGuess({ sessionId, role: 'ALPHA', guess: session.heistSecrets.stage3Code });
    }
  }

  const stage = session.beta.stages[session.beta.currentStageIndex];
  if (!stage) throw new Error('No active Beta stage');

  return submitCoopGuess({
    sessionId,
    role: 'beta',
    guess: stage.secret,
  });
}

/**
 * ============================================================================
 * TASK 13: Profile, Skill Tree, Factions, Daily Breach, and Extras State
 * ============================================================================
 */

export interface MockTask13Data {
  profile: DeckerProfile;
  skills: SkillNode[];
  availableSkillPoints: number;
  factions: FactionStanding[];
  dailyBreach: DailyBreachData;
  achievements: Achievement[];
  replays: BreachReplay[];
  friends: FriendProfile[];
  notifications: AppNotification[];
}

const defaultTask13Data: MockTask13Data = {
  profile: {
    handle: 'ZERO_COOL',
    avatarUrl: '/icons/glyph-camera.svg',
    rank: {
      title: 'Netrunner Prime',
      level: 7,
      currentXp: 3450,
      nextLevelXp: 5000,
    },
    stats: {
      totalHacks: 42,
      successfulBreaches: 36,
      failedBreaches: 6,
      winRatePercent: calculateWinRate(36, 42),
      currentStreak: 5,
      bestStreak: 12,
      totalCreditsEarned: 38400,
      fastestBreachSeconds: 24,
      fewestGuesses: 3,
    },
    cosmetics: {
      activeBadge: 'badge-cyber-phoenix',
      activeTerminalTheme: 'amber-crt',
      activeDeckFrame: 'frame-carbon-hex',
      unlockedBadges: ['badge-cyber-phoenix', 'badge-ghost-protocol', 'badge-daily-master'],
      unlockedThemes: ['amber-crt', 'phosphor-green', 'cyan-cold'],
      unlockedFrames: ['frame-carbon-hex', 'frame-matte-black', 'frame-brass-industrial'],
    },
  },
  availableSkillPoints: 4,
  skills: SPECIALIZATION_SKILLS.map((s) => {
    if (s.id === 'slipstream_boot' || s.id === 'dead_channel_sweep') {
      return { ...s, unlocked: true };
    }
    return { ...s };
  }),
  factions: JSON.parse(JSON.stringify(FACTION_CATALOG)),
  dailyBreach: {
    date: '2026-10-12',
    seed: getDailyBreachSeed('2026-10-12'),
    nodeName: 'Sub-Grid Core 09',
    tier: 3,
    digits: 4,
    allowDuplicates: false,
    maxAttempts: 7,
    timeLimitSeconds: 90,
    bounty: 5000,
    userCompleted: false,
    leaderboard: [
      {
        rank: 1,
        handle: 'Acid_Burn',
        avatarUrl: '/icons/glyph-router.svg',
        guessesCount: 3,
        timeSeconds: 32,
        completedAt: '08:14 UTC',
        rewardTier: 'Diamond',
      },
      {
        rank: 2,
        handle: 'CrashOver',
        avatarUrl: '/icons/glyph-terminal.svg',
        guessesCount: 4,
        timeSeconds: 38,
        completedAt: '09:05 UTC',
        rewardTier: 'Gold',
      },
      {
        rank: 3,
        handle: 'Cereal_Killer',
        avatarUrl: '/icons/glyph-atm.svg',
        guessesCount: 4,
        timeSeconds: 45,
        completedAt: '10:22 UTC',
        rewardTier: 'Silver',
      },
      {
        rank: 4,
        handle: 'Lord_Nikon',
        avatarUrl: '/icons/glyph-safe.svg',
        guessesCount: 5,
        timeSeconds: 52,
        completedAt: '11:40 UTC',
        rewardTier: 'Bronze',
      },
      {
        rank: 5,
        handle: 'Phantom_Phreak',
        avatarUrl: '/icons/glyph-camera.svg',
        guessesCount: 5,
        timeSeconds: 59,
        completedAt: '12:15 UTC',
        rewardTier: 'Bronze',
      },
    ],
  },
  achievements: [
    {
      id: 'ach-first-blood',
      title: 'First Contact',
      description: 'Successfully complete your first node breach.',
      category: 'mastery',
      unlocked: true,
      unlockedAt: Date.now() - 3600000 * 48,
      progress: 1,
      maxProgress: 1,
      rewardCoins: 10,
    },
    {
      id: 'ach-streak-master',
      title: 'Neural Flow',
      description: 'Maintain a 5-win streak without a single failed breach.',
      category: 'streak',
      unlocked: true,
      unlockedAt: Date.now() - 3600000 * 12,
      progress: 5,
      maxProgress: 5,
      rewardCoins: 25,
    },
    {
      id: 'ach-flawless-hack',
      title: 'Zero Latency',
      description: 'Breach a 4-digit terminal in 3 guesses or fewer.',
      category: 'mastery',
      unlocked: true,
      unlockedAt: Date.now() - 3600000 * 6,
      progress: 1,
      maxProgress: 1,
      rewardCoins: 50,
    },
    {
      id: 'ach-daily-veteran',
      title: 'Routine Infiltration',
      description: 'Participate in 7 Daily Breach sessions.',
      category: 'special',
      unlocked: false,
      progress: 3,
      maxProgress: 7,
      rewardCoins: 75,
    },
    {
      id: 'ach-faction-allied',
      title: 'Kingmaker',
      description: 'Achieve Allied standing (60+ reputation) with any faction.',
      category: 'syndicate',
      unlocked: true,
      unlockedAt: Date.now() - 3600000 * 24,
      progress: 65,
      maxProgress: 60,
      rewardCoins: 40,
    },
  ],
  replays: [
    {
      id: 'replay-fenwick-01',
      nodeName: 'Fenwick Market Register',
      date: '2026-10-11',
      won: true,
      targetDigits: 4,
      secretCodeRevealed: '4829',
      guesses: [
        { step: 1, guess: '1234', pots: 0, pans: 2, timeElapsedSeconds: 8, note: 'Initial probe testing low spectrum' },
        { step: 2, guess: '5678', pots: 0, pans: 1, timeElapsedSeconds: 16, note: 'Testing high spectrum' },
        { step: 3, guess: '9024', pots: 1, pans: 2, timeElapsedSeconds: 26, note: 'Isolating candidate digits 2, 4, 8, 9' },
        { step: 4, guess: '4829', pots: 4, pans: 0, timeElapsedSeconds: 34, note: 'Full permutation lock-in' },
      ],
    },
    {
      id: 'replay-meridian-atm',
      nodeName: 'Meridian Ave ATM',
      date: '2026-10-10',
      won: true,
      targetDigits: 4,
      secretCodeRevealed: '7193',
      guesses: [
        { step: 1, guess: '0123', pots: 1, pans: 1, timeElapsedSeconds: 10, note: 'Initial low probe' },
        { step: 2, guess: '4567', pots: 0, pans: 1, timeElapsedSeconds: 22, note: 'Searching middle bands' },
        { step: 3, guess: '8910', pots: 0, pans: 2, timeElapsedSeconds: 35, note: 'Pinpointing 1 and 9' },
        { step: 4, guess: '7193', pots: 4, pans: 0, timeElapsedSeconds: 46, note: 'Crack confirmed' },
      ],
    },
  ],
  friends: [
    {
      id: 'fr-acid-burn',
      handle: 'Acid_Burn',
      avatarUrl: '/icons/glyph-router.svg',
      status: 'online',
      rankTitle: 'Elite Phreaker',
      bestStreak: 18,
    },
    {
      id: 'fr-crash-over',
      handle: 'CrashOver',
      avatarUrl: '/icons/glyph-terminal.svg',
      status: 'in-breach',
      rankTitle: 'Corporate Infiltrator',
      bestStreak: 14,
    },
    {
      id: 'fr-cereal-killer',
      handle: 'Cereal_Killer',
      avatarUrl: '/icons/glyph-atm.svg',
      status: 'offline',
      rankTitle: 'Hardware Splicer',
      bestStreak: 9,
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      title: 'Faction Standing Updated',
      message: 'Iron Guild promoted your status to Allied! 25% hardware repair discount unlocked.',
      type: 'faction',
      timestamp: Date.now() - 3600000 * 3,
      read: false,
    },
    {
      id: 'notif-2',
      title: 'New Daily Breach Available',
      message: 'Sub-Grid Core 09 is now active. Compete on the global leaderboard for 5,000 credits!',
      type: 'system',
      timestamp: Date.now() - 3600000 * 5,
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Achievement Unlocked',
      message: 'You completed "Zero Latency" and claimed 50 coins.',
      type: 'achievement',
      timestamp: Date.now() - 3600000 * 6,
      read: true,
    },
  ],
};

export let mockTask13 = JSON.parse(JSON.stringify(defaultTask13Data)) as MockTask13Data;

export function getProfile(): DeckerProfile {
  return mockTask13.profile;
}

export function updateCosmetics(cosmetics: Partial<DeckerProfile['cosmetics']>): DeckerProfile {
  mockTask13.profile.cosmetics = {
    ...mockTask13.profile.cosmetics,
    ...cosmetics,
  };
  return mockTask13.profile;
}

export function getSkillTree(): { skills: SkillNode[]; availablePoints: number } {
  return {
    skills: mockTask13.skills,
    availablePoints: mockTask13.availableSkillPoints,
  };
}

export function unlockSkillNode(skillId: string): { success: boolean; skill?: SkillNode; remainingPoints: number; error?: string } {
  const target = mockTask13.skills.find((s) => s.id === skillId);
  if (!target) return { success: false, remainingPoints: mockTask13.availableSkillPoints, error: 'Skill node not found' };

  const unlockedIds = mockTask13.skills.filter((s) => s.unlocked).map((s) => s.id);
  const check = canUnlockSkill(target, unlockedIds, mockTask13.availableSkillPoints, mockTask13.skills);
  if (!check.canUnlock) {
    return { success: false, remainingPoints: mockTask13.availableSkillPoints, error: check.reason };
  }

  target.unlocked = true;
  mockTask13.availableSkillPoints -= target.pointCost;
  return {
    success: true,
    skill: target,
    remainingPoints: mockTask13.availableSkillPoints,
  };
}

export function respecSkills(): { success: boolean; skills: SkillNode[]; availablePoints: number } {
  const res = respecSkillTree(mockTask13.skills, mockTask13.availableSkillPoints);
  mockTask13.skills = res.skills;
  mockTask13.availableSkillPoints = res.totalAvailablePoints;
  return {
    success: true,
    skills: mockTask13.skills,
    availablePoints: mockTask13.availableSkillPoints,
  };
}

export function getFactions(): FactionStanding[] {
  return mockTask13.factions;
}

export function acceptFactionContract(contractId: string): { success: boolean; contractTitle: string; reputationChanges: Record<string, number>; message: string; warning?: string } {
  let targetContract: any = null;
  let hostingFaction: FactionStanding | null = null;

  for (const f of mockTask13.factions) {
    const c = f.exclusiveContracts.find((x) => x.id === contractId);
    if (c) {
      targetContract = c;
      hostingFaction = f;
      break;
    }
  }

  if (!targetContract || !hostingFaction) {
    throw new Error('Faction contract not found');
  }

  // Adjust hosting faction reputation
  hostingFaction.reputation = Math.min(100, hostingFaction.reputation + targetContract.reputationReward);
  hostingFaction.standingLevel = getStandingLevel(hostingFaction.reputation);

  // Penalize opposing faction if exists
  let penaltyApplied = 0;
  if (targetContract.opposingFactionId) {
    const rival = mockTask13.factions.find((f) => f.id === targetContract.opposingFactionId);
    if (rival) {
      rival.reputation = Math.max(-100, rival.reputation - targetContract.repPenaltyOpponents);
      rival.standingLevel = getStandingLevel(rival.reputation);
      penaltyApplied = targetContract.repPenaltyOpponents;
    }
  }

  return {
    success: true,
    contractTitle: targetContract.title,
    reputationChanges: {
      [hostingFaction.id]: targetContract.reputationReward,
      ...(targetContract.opposingFactionId ? { [targetContract.opposingFactionId]: -penaltyApplied } : {}),
    },
    message: `Accepted contract: ${targetContract.title} for ${hostingFaction.name}`,
    warning: targetContract.opposingFactionId
      ? `Rival faction standing penalized by -${penaltyApplied}.`
      : undefined,
  };
}

export function getDailyBreach(): DailyBreachData {
  return mockTask13.dailyBreach;
}

export function submitDailyBreachAttempt(guessesCount: number, timeSeconds: number): DailyBreachData {
  const newRank = Math.min(6, mockTask13.dailyBreach.leaderboard.length + 1);
  const userEntry = {
    rank: newRank,
    handle: mockTask13.profile.handle,
    avatarUrl: mockTask13.profile.avatarUrl,
    guessesCount,
    timeSeconds,
    completedAt: 'Just now',
    rewardTier: guessesCount <= 4 ? 'Gold' : 'Silver',
  };

  mockTask13.dailyBreach.userCompleted = true;
  mockTask13.dailyBreach.userResult = {
    guessesCount,
    timeSeconds,
    rank: newRank,
  };

  mockTask13.dailyBreach.leaderboard.push(userEntry);
  mockTask13.dailyBreach.leaderboard.sort((a, b) => {
    if (a.guessesCount !== b.guessesCount) return a.guessesCount - b.guessesCount;
    return a.timeSeconds - b.timeSeconds;
  });

  mockTask13.dailyBreach.leaderboard.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return mockTask13.dailyBreach;
}

export function getAchievements(): Achievement[] {
  return mockTask13.achievements;
}

export function getReplays(): BreachReplay[] {
  return mockTask13.replays.map((r) => {
    const report = analyzeBreachReplay(r.secretCodeRevealed, r.guesses, { length: r.targetDigits });
    return {
      ...r,
      analysis: report,
      guesses: r.guesses.map((g, idx) => ({
        ...g,
        analysis: report.steps[idx],
      })),
    };
  });
}

export function getFriends(): FriendProfile[] {
  return mockTask13.friends;
}

export function getNotifications(): AppNotification[] {
  return mockTask13.notifications;
}

export function markNotificationRead(id: string): AppNotification[] {
  const notif = mockTask13.notifications.find((n) => n.id === id);
  if (notif) notif.read = true;
  return mockTask13.notifications;
}
