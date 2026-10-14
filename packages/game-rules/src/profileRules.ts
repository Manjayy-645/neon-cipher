import {
  DeckerProfile,
  SkillNode,
  FactionStanding,
  DailyBreachData,
  Achievement,
  BreachReplay,
  FriendProfile,
  AppNotification,
} from './profileTypes';

export * from './profileTypes';

/**
 * Calculates win rate percentage rounded to 1 decimal place.
 */
export function calculateWinRate(successful: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((successful / total) * 1000) / 10;
}

export const SKILL_BRANCH_GUIDES = {
  infiltration: {
    branch: 'infiltration' as const,
    title: 'Infiltration',
    subtitle: 'Speed & Clock Control',
    badge: 'INF',
    nixSummary: 'Pick this tree if you hate countdown timers and want extra breathing room before security traces you.',
  },
  analysis: {
    branch: 'analysis' as const,
    title: 'Analysis',
    subtitle: 'Deduction & ICE Immunity',
    badge: 'ANL',
    nixSummary: 'Pick this tree if you want the cyberdeck to help you eliminate numbers and expose lying ICE.',
  },
  exploitation: {
    branch: 'exploitation' as const,
    title: 'Exploitation',
    subtitle: 'Economy, Duels & Sabotage',
    badge: 'EXP',
    nixSummary: 'Pick this tree to maximize credit bounties, reduce Black Market prices, and hit harder in 1v1 duels.',
  },
};

export const SPECIALIZATION_SKILLS: SkillNode[] = [
  // Branch 1: INFILTRATION
  {
    id: 'slipstream_boot',
    name: 'Slipstream Boot',
    branch: 'infiltration',
    tier: 1,
    pointCost: 1,
    prerequisites: [],
    unlocked: false,
    effectKey: 'STARTING_CLOCK_BONUS',
    effectSummary: '+5s starting clock on all nodes.',
    description: 'Bypasses network handshakes to grant extra time buffer before traces initialize.',
  },
  {
    id: 'cool_running',
    name: 'Cool Running',
    branch: 'infiltration',
    tier: 2,
    pointCost: 2,
    prerequisites: ['slipstream_boot'],
    unlocked: false,
    effectKey: 'HEAT_REDUCTION',
    effectSummary: 'Reduces Sector Heat gained on failed breaches by 25%.',
    description: 'Dissipates terminal thermal buildup, dampening trace signals sent to district patrols.',
  },
  {
    id: 'phantom_protocol',
    name: 'Phantom Protocol',
    branch: 'infiltration',
    tier: 3,
    isCapstone: true,
    pointCost: 3,
    prerequisites: ['cool_running'],
    unlocked: false,
    effectKey: 'FIRST_GUESS_FREEZE',
    effectSummary: 'First guess on any breach pauses trace clock for 8s and generates 0% trace noise.',
    description: 'Capstone Routine. First probing cipher cloaks your signature completely, freezing security clocks.',
  },

  // Branch 2: ANALYSIS
  {
    id: 'dead_channel_sweep',
    name: 'Dead Channel Sweep',
    branch: 'analysis',
    tier: 1,
    pointCost: 1,
    prerequisites: [],
    unlocked: false,
    effectKey: 'DEAD_GUESS_REFUND',
    effectSummary: 'On any 0 Pan / 0 Pot guess, refunds 3 seconds to your clock.',
    description: 'Turns miss signals into useful frequency sweeps, immediately recovering cognitive clock time.',
  },
  {
    id: 'ice_diagnostics',
    name: 'ICE Diagnostics',
    branch: 'analysis',
    tier: 2,
    pointCost: 2,
    prerequisites: ['dead_channel_sweep'],
    unlocked: false,
    effectKey: 'ICE_TYPE_REVEAL',
    effectSummary: 'Automatically warns you in the terminal header which specific ICE type (Liar, Ghost, or Drift) is active on boot.',
    description: 'Deep packet inspection decodes countermeasure banners on connection before you enter your first probe.',
  },
  {
    id: 'quantum_sieve',
    name: 'Quantum Sieve',
    branch: 'analysis',
    tier: 3,
    isCapstone: true,
    pointCost: 3,
    prerequisites: ['ice_diagnostics'],
    unlocked: false,
    effectKey: 'GUARANTEED_DIGIT_HIGHLIGHT',
    effectSummary: 'After your 3rd guess, automatically highlights 1 digit on your keypad that is 100% guaranteed to be in the secret code.',
    description: 'Capstone Routine. Computes combinatorial entropy collapse to identify a guaranteed secret digit.',
  },

  // Branch 3: EXPLOITATION
  {
    id: 'backdoor_skim',
    name: 'Backdoor Skim',
    branch: 'exploitation',
    tier: 1,
    pointCost: 1,
    prerequisites: [],
    unlocked: false,
    effectKey: 'BOUNTY_BOOST',
    effectSummary: '+15% credit bounty on all solo and campaign breaches.',
    description: 'Siphons auxiliary micro-ledger balances directly into your anonymous offshore wallet.',
  },
  {
    id: 'black_market_voucher',
    name: 'Black Market Voucher',
    branch: 'exploitation',
    tier: 2,
    pointCost: 2,
    prerequisites: ['backdoor_skim'],
    unlocked: false,
    effectKey: 'BLACK_MARKET_DISCOUNT',
    effectSummary: '15% discount on all Consumables in Glitch\'s Market.',
    description: 'Forges credential vouchers recognized by Glitch and black market hardware peddlers.',
  },
  {
    id: 'zero_day_payload',
    name: 'Zero-Day Payload',
    branch: 'exploitation',
    tier: 3,
    isCapstone: true,
    pointCost: 3,
    prerequisites: ['black_market_voucher'],
    unlocked: false,
    effectKey: 'DUEL_PROBE_AND_COOLDOWN',
    effectSummary: 'Starts every 1v1 Duel with 1 free Stealth Probe charge and reduces Sabotage Tool cooldowns.',
    description: 'Capstone Routine. Arms your cyberdeck with pre-loaded zero-day exploit spikes for competitive matches.',
  },
];

/**
 * Checks whether a skill node is a Capstone (Tier 3) skill.
 */
export function isCapstoneSkill(skill: SkillNode | string): boolean {
  if (typeof skill === 'string') {
    const found = SPECIALIZATION_SKILLS.find((s) => s.id === skill);
    return found ? !!found.isCapstone || found.tier === 3 : false;
  }
  return !!skill.isCapstone || skill.tier === 3;
}

/**
 * Checks whether a skill node can be unlocked given currently unlocked skill IDs and available skill points.
 * Enforces that only ONE Capstone (Tier 3) skill can be active at a time.
 */
export function canUnlockSkill(
  skill: SkillNode,
  unlockedSkillIds: string[],
  availablePoints: number,
  allSkills: SkillNode[] = SPECIALIZATION_SKILLS
): { canUnlock: boolean; reason?: string } {
  if (skill.unlocked || unlockedSkillIds.includes(skill.id)) {
    return { canUnlock: false, reason: 'Skill already unlocked' };
  }
  if (availablePoints < skill.pointCost) {
    return { canUnlock: false, reason: `Requires ${skill.pointCost} skill points (have ${availablePoints})` };
  }
  const missingPrereqs = skill.prerequisites.filter((id) => !unlockedSkillIds.includes(id));
  if (missingPrereqs.length > 0) {
    return { canUnlock: false, reason: `Missing prerequisite skills: ${missingPrereqs.join(', ')}` };
  }

  // Capstone exclusivity rule: Only ONE Capstone (Tier 3) skill active at a time
  if (isCapstoneSkill(skill)) {
    const existingActiveCapstone = unlockedSkillIds.find((id) => {
      const s = allSkills.find((item) => item.id === id);
      return s ? isCapstoneSkill(s) : false;
    });
    if (existingActiveCapstone) {
      return {
        canUnlock: false,
        reason: 'Only one Capstone skill can be active at a time. Respec to switch specializations.',
      };
    }
  }

  return { canUnlock: true };
}

/**
 * Resets all unlocked skills in the skill tree and refunds 100% of spent skill points.
 */
export function respecSkillTree(
  skills: SkillNode[],
  currentAvailablePoints: number
): { skills: SkillNode[]; refundedPoints: number; totalAvailablePoints: number } {
  let refundedPoints = 0;
  const updatedSkills = skills.map((skill) => {
    if (skill.unlocked) {
      refundedPoints += skill.pointCost;
      return { ...skill, unlocked: false };
    }
    return { ...skill };
  });

  return {
    skills: updatedSkills,
    refundedPoints,
    totalAvailablePoints: currentAvailablePoints + refundedPoints,
  };
}

/**
 * Returns faction standing rank label based on numeric reputation score (-100 to +100).
 */
export function getStandingLevel(reputation: number): 'Hostile' | 'Neutral' | 'Favored' | 'Allied' {
  if (reputation <= -30) return 'Hostile';
  if (reputation >= 60) return 'Allied';
  if (reputation >= 20) return 'Favored';
  return 'Neutral';
}

/**
 * Calculates Faction Reputation Milestone (Rank 1: Known, Rank 2: Trusted, Rank 3: Inner Circle).
 */
export function getFactionMilestone(reputation: number): {
  rankNumber: 0 | 1 | 2 | 3;
  rankName: 'Neutral' | 'Rank 1: Known' | 'Rank 2: Trusted' | 'Rank 3: Inner Circle';
  nextRankThreshold?: number;
} {
  if (reputation >= 65) return { rankNumber: 3, rankName: 'Rank 3: Inner Circle' };
  if (reputation >= 35) return { rankNumber: 2, rankName: 'Rank 2: Trusted', nextRankThreshold: 65 };
  if (reputation >= 10) return { rankNumber: 1, rankName: 'Rank 1: Known', nextRankThreshold: 35 };
  return { rankNumber: 0, rankName: 'Neutral', nextRankThreshold: 10 };
}

export const FACTION_CATALOG: FactionStanding[] = [
  {
    id: 'kovacs-syndicate',
    name: 'Kovacs Syndicate',
    motto: 'Debt is leverage. Leverage is king.',
    description: "Old-world loan sharks and syndicate enforcers controlling Low Meridian's high-stakes loan operations and underground duel circuits.",
    reputation: 15,
    standingLevel: 'Neutral',
    repRank: 'Rank 1: Known',
    glitchCommentary: 'Pay your campaign debt on time and take Kovacs contract hits to gain Kovacs trust.',
    milestones: [
      { rank: 1, name: 'Rank 1: Known', repRequired: 10, perk: '5% reduced syndicate rake on 1v1 Duels' },
      { rank: 2, name: 'Rank 2: Trusted', repRequired: 35, perk: 'Loan repayment deadline extensions & 10% debt relief bonuses' },
      { rank: 3, name: 'Rank 3: Inner Circle', repRequired: 65, perk: 'Access to High-Roller syndicate duels with zero rake' },
    ],
    perks: ['5% reduced syndicate rake on 1v1 Duels'],
    opposingFactionId: 'aeris-corp',
    exclusiveContracts: [
      {
        id: 'contract-kovacs-1',
        title: 'Debt Recovery Extraction',
        targetNode: 's2',
        bounty: 2500,
        reputationReward: 15,
        repPenaltyOpponents: 20,
        opposingFactionId: 'aeris-corp',
        description: 'Extract defaulting debtor credentials from Canal Bank terminal before corporate liquidation.',
      },
    ],
  },
  {
    id: 'street-collective',
    name: 'Street Collective',
    motto: 'Open source the city. Liberate the grid.',
    description: 'Decentralized activist network fighting corporate data cartels and surveillance infrastructure across the Slums.',
    reputation: 40,
    standingLevel: 'Favored',
    repRank: 'Rank 2: Trusted',
    glitchCommentary: 'Defend Slum district nodes, crack media relays, and keep public infrastructure unmonitored.',
    milestones: [
      { rank: 1, name: 'Rank 1: Known', repRequired: 10, perk: '10% discount on software tools in the Black Market' },
      { rank: 2, name: 'Rank 2: Trusted', repRequired: 35, perk: '1 free Safehouse trace-scrub per day & Slum turf dividends' },
      { rank: 3, name: 'Rank 3: Inner Circle', repRequired: 65, perk: 'Collective mesh relay provides +1 attempt pip on Slum terminals' },
    ],
    perks: ['10% discount on software tools in the Black Market', '1 free Safehouse trace-scrub per day & Slum turf dividends'],
    opposingFactionId: 'aeris-corp',
    exclusiveContracts: [
      {
        id: 'contract-collective-1',
        title: 'Public Mesh Liberation',
        targetNode: 's6',
        bounty: 3000,
        reputationReward: 20,
        repPenaltyOpponents: 25,
        opposingFactionId: 'aeris-corp',
        description: 'Siphon biometric surveillance logs and return open Wi-Fi routing to Slum residents.',
      },
    ],
  },
  {
    id: 'aeris-corp',
    name: 'Aeris Corp',
    motto: 'Order through deterrence and immutable custody.',
    description: 'Mega-conglomerate security division controlling downtown banking relays and tier 4+ vault infrastructure.',
    reputation: -10,
    standingLevel: 'Neutral',
    repRank: undefined,
    glitchCommentary: 'Crack Tier 4+ corporate nodes cleanly without tripping alarms or failing attempts.',
    milestones: [
      { rank: 1, name: 'Rank 1: Known', repRequired: 10, perk: '15% bonus credit bounties on Corporate & Government nodes' },
      { rank: 2, name: 'Rank 2: Trusted', repRequired: 35, perk: 'Advanced ICE diagnostics bypass and priority Commercial node access' },
      { rank: 3, name: 'Rank 3: Inner Circle', repRequired: 65, perk: 'Corporate immunity pass: first failed breach per day incurs 0 Sector Heat' },
    ],
    perks: [],
    opposingFactionId: 'street-collective',
    exclusiveContracts: [
      {
        id: 'contract-aeris-1',
        title: 'Asset Recovery Protocol',
        targetNode: 'c4',
        bounty: 5000,
        reputationReward: 25,
        repPenaltyOpponents: 30,
        opposingFactionId: 'street-collective',
        description: 'Recover proprietary cipher matrices from hacked Commercial relay safe.',
      },
    ],
  },
];

/**
 * Validates whether accepting a contract creates a conflict or penalty with an opposing faction.
 */
export function checkMutualExclusion(
  faction: FactionStanding,
  opposingFaction?: FactionStanding
): { warning: boolean; message?: string } {
  if (!faction.opposingFactionId || !opposingFaction) {
    return { warning: false };
  }
  return {
    warning: true,
    message: `Warning: Assisting ${faction.name} inflicts reputation penalties on their bitter rival, ${opposingFaction.name}. High standing with both is mutually exclusive.`,
  };
}

/**
 * Daily Breach deterministic seed generator for a given date string YYYY-MM-DD
 */
export function getDailyBreachSeed(dateString: string): string {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash << 5) - hash + dateString.charCodeAt(i);
    hash |= 0;
  }
  return `DB-${Math.abs(hash).toString(16).toUpperCase()}`;
}
