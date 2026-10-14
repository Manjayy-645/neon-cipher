import { checkContradiction, calculateScore } from './index';

// ---------------------------------------------------------------------------
// 1. CONSUMABLE TERMINAL & INTRUSION TOOLS
// ---------------------------------------------------------------------------

export type ConsumableCategory = 'sabotage' | 'utility' | 'exploit';

export interface TerminalToolRule {
  id: string;
  name: string;
  creditCost?: number;
  coinCost?: number;
  category?: ConsumableCategory;
  effectType:
    | 'eliminate_digit'
    | 'firewall_shield'
    | 'add_time'
    | 'detect_duplicates'
    | 'probe_parity'
    | 'blackout_ping'
    | 'false_flag_echo'
    | 'extra_attempts'
    | 'slot_peek'
    | 'contradiction_scan'
    | 'second_chance'
    | 'skeleton_key'
    | 'freeze_timer'
    | 'cleanse_ice';
  description: string;
  freezeDurationMs?: number;
  freezeDurationSeconds?: number;
  cleanseTurns?: number;
  glitchPitch?: string;
  nixExplanation?: string;
  recommendedWhen?: string;
}

export const TERMINAL_TOOL_RULES: Record<string, TerminalToolRule> = {
  // --- SOLO / CO-OP UTILITY CONSUMABLES (New Specification) ---
  'cryo_spike': {
    id: 'cryo_spike',
    name: 'Cryo-Spike',
    creditCost: 375,
    category: 'utility',
    effectType: 'freeze_timer',
    freezeDurationMs: 12000,
    freezeDurationSeconds: 12,
    description: 'Freezes active ICE trace countdown clock for 12 seconds during breach.',
    glitchPitch: 'Black-market cryo-fuse. Shuts down ICE timing chips cold before security pinpoints your signal.',
    nixExplanation: 'Need time to think? Pop a Cryo-Spike to freeze the countdown clock for 12 seconds while you work out the math.',
    recommendedWhen: 'Best used on Tier 3–5 vaults with tight 30s–45s timers.',
  },
  'tool-cryo-spike': {
    id: 'tool-cryo-spike',
    name: 'Cryo-Spike',
    creditCost: 375,
    category: 'utility',
    effectType: 'freeze_timer',
    freezeDurationMs: 12000,
    freezeDurationSeconds: 12,
    description: 'Freezes active ICE trace countdown clock for 12 seconds during breach.',
    glitchPitch: 'Black-market cryo-fuse. Shuts down ICE timing chips cold before security pinpoints your signal.',
    nixExplanation: 'Need time to think? Pop a Cryo-Spike to freeze the countdown clock for 12 seconds while you work out the math.',
    recommendedWhen: 'Best used on Tier 3–5 vaults with tight 30s–45s timers.',
  },
  'cleanse_subroutine': {
    id: 'cleanse_subroutine',
    name: 'Cleanse Subroutine',
    creditCost: 425,
    category: 'utility',
    effectType: 'cleanse_ice',
    cleanseTurns: 2,
    description: 'Purges active Liar, Drift, or Ghost ICE for 2 turns and reveals uncorrupted clue counts.',
    glitchPitch: 'Surgical antivirus injection. Strips corporate ICE cloaking and corruption right out of the data bus.',
    nixExplanation: 'If a corporate node is lying to you or hiding clue dots, run this subroutine to scrub the virus and see the real numbers.',
    recommendedWhen: 'Mandatory when tackling Commercial Strip nodes with active ICE defenses.',
  },
  'tool-cleanse-subroutine': {
    id: 'tool-cleanse-subroutine',
    name: 'Cleanse Subroutine',
    creditCost: 425,
    category: 'utility',
    effectType: 'cleanse_ice',
    cleanseTurns: 2,
    description: 'Purges active Liar, Drift, or Ghost ICE for 2 turns and reveals uncorrupted clue counts.',
    glitchPitch: 'Surgical antivirus injection. Strips corporate ICE cloaking and corruption right out of the data bus.',
    nixExplanation: 'If a corporate node is lying to you or hiding clue dots, run this subroutine to scrub the virus and see the real numbers.',
    recommendedWhen: 'Mandatory when tackling Commercial Strip nodes with active ICE defenses.',
  },

  // --- PVP / SABOTAGE CONSUMABLE INTRUSION TOOLS ---
  'tool-static-injector': {
    id: 'tool-static-injector',
    name: 'Static Injector',
    creditCost: 300,
    category: 'sabotage',
    effectType: 'eliminate_digit',
    description: 'Scrambles frequency noise to eliminate a false dead digit.',
    glitchPitch: 'Cheap frequency burster. Smashes carrier static until one false number drops off.',
    nixExplanation: 'Pushes static noise through the terminal keypad to eliminate one number guaranteed not to be in the code.',
    recommendedWhen: 'Use on your first turn when you need to narrow down the candidate pool.',
  },
  'tool-frequency-probe': {
    id: 'tool-frequency-probe',
    name: 'Frequency Probe',
    creditCost: 400,
    category: 'sabotage',
    effectType: 'probe_parity',
    description: 'Probes carrier bus to calculate whether code digit sum is even or odd.',
    glitchPitch: 'Harmonic sniffer. Tells you if the sum of all digits is Even or Odd.',
    nixExplanation: 'Calculates the sum of all code digits and tells you if the total is Even or Odd.',
    recommendedWhen: 'Helpful on 4-digit codes when you are weighing high vs low candidate sums.',
  },
  'tool-firewall-patch': {
    id: 'tool-firewall-patch',
    name: 'Firewall Patch',
    creditCost: 450,
    category: 'utility',
    effectType: 'firewall_shield',
    description: 'Primes a defensive shield against ICE distortions.',
    glitchPitch: 'Defensive ICE dampener. Absorbs an incoming sabotage strike before it corrupts your display.',
    nixExplanation: 'Arms a defensive shield that neutralizes the next ICE distortion or sabotage attack.',
    recommendedWhen: 'Equip before tackling nodes with active Liar or Drift ICE.',
  },
  'tool-blackout-ping': {
    id: 'tool-blackout-ping',
    name: 'Blackout Ping',
    creditCost: 550,
    category: 'sabotage',
    effectType: 'blackout_ping',
    description: 'Blinds security telemetry sensors for a safe probe window.',
    glitchPitch: 'EMP burst for remote sensors. Blinds telemetry monitors for a quick window.',
    nixExplanation: 'Blinds remote sensor telemetry to prevent security alarms from logging your probe.',
    recommendedWhen: 'Best used in PvP duels to blind opponent clue history.',
  },
  'tool-signal-sniffer': {
    id: 'tool-signal-sniffer',
    name: 'Signal Sniffer',
    creditCost: 600,
    category: 'utility',
    effectType: 'detect_duplicates',
    description: 'Probes carrier harmonics to confirm whether digits repeat.',
    glitchPitch: 'Phase comparator. Detects whether the cipher engine repeats any digits.',
    nixExplanation: 'Checks whether the target cipher has repeating numbers or if every digit is unique.',
    recommendedWhen: 'Critical on Tier 3+ Corporate nodes where repeating numbers are enabled.',
  },
  'tool-snoop-packet': {
    id: 'tool-snoop-packet',
    name: 'Snoop Packet',
    creditCost: 750,
    category: 'sabotage',
    effectType: 'eliminate_digit',
    description: 'Intercepts carrier packets to unmask a confirmed dead digit.',
    glitchPitch: 'Deep-packet sniffer. Pulls discarded buffer bytes to identify a dead number.',
    nixExplanation: 'Intercepts raw bus packets to find a dead number and purge it from your keypad.',
    recommendedWhen: 'Use on high-tier nodes with large combinations.',
  },
  'tool-trace-accelerator': {
    id: 'tool-trace-accelerator',
    name: 'Trace Accelerator',
    creditCost: 800,
    category: 'utility',
    effectType: 'add_time',
    description: 'Injects delay cycles, adding 10 seconds to the countdown clock.',
    glitchPitch: 'Clock dilator. Delays tracing routines by 10 full seconds.',
    nixExplanation: 'Injects lag cycles into the trace daemon to give you 10 extra seconds on the timer.',
    recommendedWhen: 'Activate when the lockdown timer is under 15 seconds.',
  },
  'tool-cryo-pulse': {
    id: 'tool-cryo-pulse',
    name: 'Cryo-Pulse Spike',
    creditCost: 950,
    category: 'utility',
    effectType: 'freeze_timer',
    freezeDurationMs: 15000,
    freezeDurationSeconds: 15,
    description: 'Injects a cryogenic pulse that freezes the ICE countdown clock for 15 seconds.',
    glitchPitch: 'High-yield cryogenic capacitor. Freezes the lockdown clock solid for 15 seconds.',
    nixExplanation: 'Freezes the active timer countdown completely for 15 seconds.',
    recommendedWhen: 'Essential for high-tier vaults where every second of deduction matters.',
  },
  'tool-zero-day': {
    id: 'tool-zero-day',
    name: 'Zero-Day Exploit',
    creditCost: 1250,
    category: 'utility',
    effectType: 'slot_peek',
    description: 'Unmasks 1 confirmed correct code digit in its exact slot position.',
    glitchPitch: 'Unpatched master vulnerability. Bypasses one full slot and hands you the exact number.',
    nixExplanation: 'Directly reveals the exact digit for one unmasked slot in the code.',
    recommendedWhen: 'Use when down to your final 2 attempts to lock in a guaranteed correct position.',
  },
  'tool-false-flag-echo': {
    id: 'tool-false-flag-echo',
    name: 'False Flag Echo',
    creditCost: 1100,
    category: 'sabotage',
    effectType: 'false_flag_echo',
    description: 'Emits a decoy trace signature to confuse defensive ICE.',
    glitchPitch: 'Spoofed signal generator. Feeds false telemetry to defensive ICE and rival deckers.',
    nixExplanation: 'Fakes your public Pot/Pan clue feedback for one turn in duel breaches.',
    recommendedWhen: 'Valuable in competitive duels when Null_Byte is reading your clue history.',
  },

  // --- EXPLOITS (Solo Intrusion Consumables, currency: coins) ---
  'exploit-digit-scrub': {
    id: 'exploit-digit-scrub',
    name: 'Digit Scrub',
    coinCost: 5,
    category: 'exploit',
    effectType: 'eliminate_digit',
    description: 'Reveals one digit that is guaranteed NOT in the cipher.',
  },
  'exploit-time-freeze': {
    id: 'exploit-time-freeze',
    name: 'Time Freeze',
    coinCost: 8,
    category: 'exploit',
    effectType: 'add_time',
    description: 'Freezes the ICE countdown timer, adding 20 seconds.',
  },
  'exploit-extra-cycle': {
    id: 'exploit-extra-cycle',
    name: 'Extra Cycle',
    coinCost: 10,
    category: 'exploit',
    effectType: 'extra_attempts',
    description: 'Grants +2 extra guess attempts to this intrusion session.',
  },
  'exploit-contradiction-scan': {
    id: 'exploit-contradiction-scan',
    name: 'Contradiction Scan',
    coinCost: 12,
    category: 'exploit',
    effectType: 'contradiction_scan',
    description: 'Highlights mathematically conflicting guesses in red.',
  },
  'exploit-slot-peek': {
    id: 'exploit-slot-peek',
    name: 'Slot Peek',
    coinCost: 15,
    category: 'exploit',
    effectType: 'slot_peek',
    description: 'Directly unmasks the exact digit for one chosen slot.',
  },
  'exploit-second-chance': {
    id: 'exploit-second-chance',
    name: 'Second Chance',
    coinCost: 20,
    category: 'exploit',
    effectType: 'second_chance',
    description: 'Instantly retries a failed node with full clue history intact.',
  },
  'exploit-skeleton-key': {
    id: 'exploit-skeleton-key',
    name: 'Skeleton Key',
    coinCost: 35,
    category: 'exploit',
    effectType: 'skeleton_key',
    description: 'Auto-cracks any Tier 1 or 2 node immediately (Zero bounty payout).',
  },
};

// ---------------------------------------------------------------------------
// 2. 4-RAIL CYBERDECK HARDWARE SYSTEM & ARCHETYPES
// ---------------------------------------------------------------------------

export type HardwareRailSlot = 'memory_1' | 'memory_2' | 'coprocessor' | 'bus_interconnect';

export type RigHardwareId =
  | 'memory_buffer_mk1'
  | 'neural_reflex_cap'
  | 'memory_buffer_mk2'
  | 'syndicate_skimmer'
  | 'heuristic_coproc'
  | 'parity_scanner_asic'
  | 'overclocked_quartz_bus'
  | 'lead_shielded_chassis';

export interface RigHardwareModule {
  id: RigHardwareId;
  name: string;
  railSlot: HardwareRailSlot;
  cost: number;
  buildArchetype: string;
  mechanicalEffect: string;
  tradeOff?: string;
  alexExplanation: string;
  nixTip: string;
  glitchPitch: string;
  icon?: string;
}

export const RIG_HARDWARE_MODULES: Record<RigHardwareId, RigHardwareModule> = {
  memory_buffer_mk1: {
    id: 'memory_buffer_mk1',
    name: 'Memory Buffer Mk I',
    railSlot: 'memory_1',
    cost: 650,
    buildArchetype: 'Balanced / Rookie',
    mechanicalEffect: '+1 max guess attempt on Tier 1 & Tier 2 nodes.',
    tradeOff: 'No attempt bonus on Tier 3+ corporate nodes.',
    alexExplanation: 'Solid starter RAM. Gives you one extra try on street locks so a bad guess doesn\'t fry your run.',
    nixTip: 'Gives you breathing room on street terminals. An extra probe before ICE trips.',
    glitchPitch: 'Street-grade RAM chips pulled from defunct ATMs. Reliable, simple, and cheap.',
    icon: '/icons/icon-memory-buffer.svg',
  },
  neural_reflex_cap: {
    id: 'neural_reflex_cap',
    name: 'Neural Reflex Capacitor',
    railSlot: 'memory_1',
    cost: 2800,
    buildArchetype: 'Speed / Duelist',
    mechanicalEffect: 'Submitting a guess within 4 seconds of your previous turn does not consume an attempt pip (Triggers max once per breach).',
    tradeOff: 'Requires quick decision making; triggers at most once per breach.',
    alexExplanation: 'Built for fast fingers. Punch your follow-up guess in under 4 seconds and the capacitor gives you that turn for free.',
    nixTip: 'If your deduction is mapped out ahead of time, double-tap quickly to earn a free turn.',
    glitchPitch: 'Military twitch-capacitors wired straight into optical relays. Rewards split-second execution.',
    icon: '/icons/icon-trace-accelerator.svg',
  },
  memory_buffer_mk2: {
    id: 'memory_buffer_mk2',
    name: 'Memory Buffer Mk II',
    railSlot: 'memory_2',
    cost: 2200,
    buildArchetype: 'Deep Breaker',
    mechanicalEffect: '+1 max guess attempt on Tier 3, Tier 4 & Tier 5 nodes.',
    tradeOff: 'High heat density; provides no bonus on Tier 1 or 2 street locks.',
    alexExplanation: 'Heavy-duty buffer for corporate vaults where every single attempt counts.',
    nixTip: 'High-spec memory rail for corporate relays. Protects against tight attempt limits.',
    glitchPitch: 'Enterprise server cache modules. When you hit downtown databanks, you will thank me.',
    icon: '/icons/icon-memory-buffer.svg',
  },
  syndicate_skimmer: {
    id: 'syndicate_skimmer',
    name: 'Syndicate Skimmer Chip',
    railSlot: 'memory_2',
    cost: 3100,
    buildArchetype: 'Cash Farmer',
    mechanicalEffect: 'Every Pan (Green exact match) scored on your very first guess immediately deposits a $45 bonus into your wallet, win or lose.',
    tradeOff: 'Occupies Memory Rail 2; gives up the +1 attempt buffer of Memory Buffer Mk II.',
    alexExplanation: 'Siphons loose credits right off the first handshake. Great for farming quick cash in The Slums.',
    nixTip: 'Lead with diverse high-frequency probe digits on Turn 1 to maximize early Pan payouts.',
    glitchPitch: 'Custom Kovacs firmware tap. Turns initial cryptographic syncs into pure street money.',
    icon: '/icons/glyph-power.svg',
  },
  heuristic_coproc: {
    id: 'heuristic_coproc',
    name: 'Heuristic Co-Processor',
    railSlot: 'coprocessor',
    cost: 1500,
    buildArchetype: 'Eliminator',
    mechanicalEffect: 'Automatically crosses off and dims 2 confirmed dead digits on the keypad as soon as you jack in.',
    tradeOff: 'Occupies Co-Processor socket; cannot equip Parity Scanner ASIC simultaneously.',
    alexExplanation: 'Cuts the guesswork down before you even touch a key. Removes two dead numbers right on boot.',
    nixTip: 'Instantly burns away two false digits right when you jack in. Cuts guesswork in half.',
    glitchPitch: 'Pre-flight signal filter that purges dead carrier noise before you even touch the keys.',
    icon: '/icons/icon-heuristic-coprocessor.svg',
  },
  parity_scanner_asic: {
    id: 'parity_scanner_asic',
    name: 'Parity Scanner ASIC',
    railSlot: 'coprocessor',
    cost: 1800,
    buildArchetype: 'Analytical',
    mechanicalEffect: 'On boot, displays the exact count of EVEN vs. ODD digits in the secret code (e.g., [2 EVEN / 2 ODD]).',
    tradeOff: 'Does not eliminate digits directly; relies on player mathematical deduction.',
    alexExplanation: 'Instead of crossing off two numbers, this tells you the exact balance of Even and Odd numbers in the lock.',
    nixTip: 'Even numbers are 0, 2, 4, 6, 8. Odd numbers are 1, 3, 5, 7, 9. Use this distribution to structure your probes.',
    glitchPitch: 'Dedicated ASIC math coprocessor that sniffs bus parity harmonics in micro-seconds.',
    icon: '/icons/glyph-router.svg',
  },
  overclocked_quartz_bus: {
    id: 'overclocked_quartz_bus',
    name: 'Overclocked Quartz Bus',
    railSlot: 'bus_interconnect',
    cost: 2400,
    buildArchetype: 'High-Risk Blitz',
    mechanicalEffect: 'Grants +15 seconds to all trace timers and +20% Credit Bounty, but reduces max attempts by -1 (min 3 attempts).',
    tradeOff: 'Runs hot—reduces max attempts by 1 attempt.',
    alexExplanation: 'Pushes your clock and payout through the roof, but runs hot—costs you 1 attempt slot. Only equip if your deduction is sharp.',
    nixTip: 'High-risk, high-reward interconnect. The extra clock lets you think, but you have fewer attempts to fail.',
    glitchPitch: 'Over-volted quartz oscillator. Drives up the score and buys you clock time, if you can stand the heat.',
    icon: '/icons/icon-stopwatch.svg',
  },
  lead_shielded_chassis: {
    id: 'lead_shielded_chassis',
    name: 'Lead-Shielded Chassis',
    railSlot: 'bus_interconnect',
    cost: 1950,
    buildArchetype: 'Tank / Low-Heat',
    mechanicalEffect: 'Reduces failure fines by 60%, cuts Sector Heat buildup by 50%, and prevents hardware burn on Tier 5 lockouts.',
    tradeOff: 'No timer extensions or bounty payout multipliers.',
    alexExplanation: 'Heavy lead lining. If a tough vault locks you out, you barely pay a fine and your rig stays safe from burn damage.',
    nixTip: 'Defensive chassis plating. Essential when probing high-security nodes where failure penalties are brutal.',
    glitchPitch: 'Military-grade lead plating. Security trace spikes bounce right off your deck casing.',
    icon: '/icons/icon-firewall-patch.svg',
  },
};

// Aliases for legacy IDs
export const HARDWARE_ID_ALIASES: Record<string, RigHardwareId> = {
  'rig-memory-buffer-1': 'memory_buffer_mk1',
  'rig-memory-buffer-2': 'memory_buffer_mk2',
  'rig-heuristic-coprocessor': 'heuristic_coproc',
};

export function normalizeHardwareId(id: string): RigHardwareId | null {
  if (id in RIG_HARDWARE_MODULES) return id as RigHardwareId;
  if (id in HARDWARE_ID_ALIASES) return HARDWARE_ID_ALIASES[id];
  return null;
}

// ---------------------------------------------------------------------------
// 3. ALEX'S RECOMMENDED LOADOUT PRESETS (1-TAP BUILD HELPER)
// ---------------------------------------------------------------------------

export interface RigPreset {
  id: 'safe_learner' | 'cash_farmer' | 'pvp_duelist';
  name: string;
  tagline: string;
  alexNote: string;
  modules: Partial<Record<HardwareRailSlot, RigHardwareId>>;
}

export const RIG_PRESETS: RigPreset[] = [
  {
    id: 'safe_learner',
    name: 'SAFE LEARNER BUILD',
    tagline: 'High tolerance & cheap fines',
    alexNote: 'Maximum extra tries, two dead numbers crossed out automatically, and cheap fines if you miss. Best for learning the ropes.',
    modules: {
      memory_1: 'memory_buffer_mk1',
      coprocessor: 'heuristic_coproc',
      bus_interconnect: 'lead_shielded_chassis',
    },
  },
  {
    id: 'cash_farmer',
    name: 'FAST CASH FARMER',
    tagline: 'High yield payout & turn-1 siphon',
    alexNote: 'Maximizes credit payouts and skims bonus cash on turn one. Use this to pay off Kovacs fast.',
    modules: {
      memory_1: 'memory_buffer_mk1',
      memory_2: 'syndicate_skimmer',
      bus_interconnect: 'overclocked_quartz_bus',
    },
  },
  {
    id: 'pvp_duelist',
    name: 'PVP DUELIST BUILD',
    tagline: 'Instant parity intel & twitch reflexes',
    alexNote: 'Built for beating Null_Byte: tells you Even/Odd counts immediately and rewards fast 4-second follow-up guesses.',
    modules: {
      memory_1: 'neural_reflex_cap',
      coprocessor: 'parity_scanner_asic',
    },
  },
];

// ---------------------------------------------------------------------------
// 4. PURE RIG STAT CALCULATOR & PARITY SCANNER
// ---------------------------------------------------------------------------

export interface NodeConfig {
  tier: number;
  attempts: number;
  timerSeconds: number;
  bounty: number;
  failureFine?: number;
  digits?: number;
  allowDuplicates?: boolean;
}

export interface EquippedRigState {
  memory_1?: RigHardwareId | null;
  memory_2?: RigHardwareId | null;
  coprocessor?: RigHardwareId | null;
  bus_interconnect?: RigHardwareId | null;
}

export interface EffectiveBreachParams {
  maxAttempts: number;
  timerSeconds: number;
  bounty: number;
  effectiveBounty: number;
  bountyMultiplier: number;
  fineReductionPercent: number;
  heatMultiplier: number;
  autoDeadDigitsCount: number;
  revealParityDistribution: boolean;
  hasNeuralReflex: boolean;
  hasSyndicateSkimmer: boolean;
  burnImmune: boolean;
  appliedModifiers: string[];
}

/**
 * Computes final effective breach parameters for a target terminal node
 * based on the player's 4-rail cyberdeck loadout.
 */
export function computeEffectiveRigStats(
  baseNode: NodeConfig,
  equippedRails: EquippedRigState
): EffectiveBreachParams {
  let attempts = baseNode.attempts;
  let timerSeconds = baseNode.timerSeconds;
  let bountyMultiplier = 1.0;
  let fineReductionPercent = 0;
  let heatMultiplier = 1.0;
  let autoDeadDigitsCount = 0;
  let revealParityDistribution = false;
  let hasNeuralReflex = false;
  let hasSyndicateSkimmer = false;
  let burnImmune = false;
  const appliedModifiers: string[] = [];

  // Rail 1: Memory 1
  if (equippedRails.memory_1 === 'memory_buffer_mk1') {
    if (baseNode.tier <= 2) {
      attempts += 1;
      appliedModifiers.push('Memory Buffer Mk I (+1 Attempt on T1/T2)');
    }
  } else if (equippedRails.memory_1 === 'neural_reflex_cap') {
    hasNeuralReflex = true;
    appliedModifiers.push('Neural Reflex Capacitor (Quick 4s Guess Refund active)');
  }

  // Rail 2: Memory 2
  if (equippedRails.memory_2 === 'memory_buffer_mk2') {
    if (baseNode.tier >= 3 && baseNode.tier <= 5) {
      attempts += 1;
      appliedModifiers.push('Memory Buffer Mk II (+1 Attempt on T3-T5)');
    }
  } else if (equippedRails.memory_2 === 'syndicate_skimmer') {
    hasSyndicateSkimmer = true;
    appliedModifiers.push('Syndicate Skimmer (+$45 per Pan on Turn 1)');
  }

  // Rail 3: Co-Processor
  if (equippedRails.coprocessor === 'heuristic_coproc') {
    autoDeadDigitsCount = 2;
    appliedModifiers.push('Heuristic Co-Processor (2 Dead Digits Purged)');
  } else if (equippedRails.coprocessor === 'parity_scanner_asic') {
    revealParityDistribution = true;
    appliedModifiers.push('Parity Scanner ASIC (Even/Odd Balance Revealed)');
  }

  // Rail 4: Bus Interconnect
  if (equippedRails.bus_interconnect === 'overclocked_quartz_bus') {
    if (timerSeconds > 0) {
      timerSeconds += 15;
    }
    bountyMultiplier += 0.2; // +20%
    attempts = Math.max(3, attempts - 1); // -1 attempt with floor of 3
    appliedModifiers.push('Overclocked Quartz Bus (+15s Clock, +20% Bounty, -1 Attempt [Floor 3])');
  } else if (equippedRails.bus_interconnect === 'lead_shielded_chassis') {
    fineReductionPercent = 60;
    heatMultiplier = 0.5;
    burnImmune = true;
    appliedModifiers.push('Lead-Shielded Chassis (-60% Fines, -50% Heat, Burn Immune)');
  }

  const finalBounty = Math.round(baseNode.bounty * bountyMultiplier);

  return {
    maxAttempts: attempts,
    timerSeconds,
    bounty: finalBounty,
    effectiveBounty: finalBounty,
    bountyMultiplier,
    fineReductionPercent,
    heatMultiplier,
    autoDeadDigitsCount,
    revealParityDistribution,
    hasNeuralReflex,
    hasSyndicateSkimmer,
    burnImmune,
    appliedModifiers,
  };
}

/**
 * Calculates the exact count of EVEN vs. ODD digits in a code.
 * Even digits: 0, 2, 4, 6, 8.
 * Odd digits: 1, 3, 5, 7, 9.
 */
export function calculateParityDistribution(secret: string): {
  evenCount: number;
  oddCount: number;
  formatted: string;
} {
  let evenCount = 0;
  let oddCount = 0;

  for (const char of secret) {
    const digit = parseInt(char, 10);
    if (!isNaN(digit)) {
      if (digit % 2 === 0) {
        evenCount++;
      } else {
        oddCount++;
      }
    }
  }

  return {
    evenCount,
    oddCount,
    formatted: `[ ${evenCount} EVEN // ${oddCount} ODD ]`,
  };
}

/**
 * Validates that an equipped rig state respects slot mutual exclusivity.
 */
export function validateEquippedRails(equipped: EquippedRigState): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  for (const [slot, id] of Object.entries(equipped)) {
    if (!id) continue;
    const mod = RIG_HARDWARE_MODULES[id as RigHardwareId];
    if (!mod) {
      errors.push(`Unknown hardware ID: ${id}`);
    } else if (mod.railSlot !== slot) {
      errors.push(`Module ${id} belongs to ${mod.railSlot}, cannot equip to ${slot}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Pure hot-swapper: equips or unequips a module on a designated rail slot.
 */
export function equipRailModule(
  current: EquippedRigState,
  slot: HardwareRailSlot,
  moduleId: RigHardwareId | null
): EquippedRigState {
  if (moduleId) {
    const mod = RIG_HARDWARE_MODULES[moduleId];
    if (!mod || mod.railSlot !== slot) {
      throw new Error(`Module ${moduleId} cannot be equipped into slot ${slot}`);
    }
  }

  return {
    ...current,
    [slot]: moduleId,
  };
}

/**
 * Applies a build archetype preset, equipping all owned parts for that preset.
 */
export function applyRigPreset(
  presetId: 'safe_learner' | 'cash_farmer' | 'pvp_duelist',
  ownedModules: RigHardwareId[]
): {
  equipped: EquippedRigState;
  equippedCount: number;
  missingModules: RigHardwareId[];
} {
  const preset = RIG_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error(`Unknown rig preset: ${presetId}`);

  const nextEquipped: EquippedRigState = {};
  const missingModules: RigHardwareId[] = [];
  let equippedCount = 0;

  for (const [slotKey, modId] of Object.entries(preset.modules)) {
    const slot = slotKey as HardwareRailSlot;
    if (modId) {
      if (ownedModules.includes(modId)) {
        nextEquipped[slot] = modId;
        equippedCount++;
      } else {
        missingModules.push(modId);
      }
    }
  }

  return {
    equipped: nextEquipped,
    equippedCount,
    missingModules,
  };
}

/**
 * Computes a "Before vs. After" stat preview when inspecting a hardware module.
 */
export interface HardwareStatPreview {
  moduleId: RigHardwareId;
  moduleName: string;
  slot: HardwareRailSlot;
  changes: Array<{
    label: string;
    before: string;
    after: string;
    delta: string;
    tone: 'positive' | 'warning' | 'neutral';
  }>;
  tradeOffNote?: string;
  slotSwapNotice?: string;
}

export function getHardwareStatPreview(
  moduleId: RigHardwareId,
  currentEquipped: EquippedRigState,
  baselineNode: NodeConfig = { tier: 2, attempts: 6, timerSeconds: 45, bounty: 650 }
): HardwareStatPreview {
  const mod = RIG_HARDWARE_MODULES[moduleId];
  if (!mod) throw new Error(`Unknown hardware module: ${moduleId}`);

  const currentModOnSlot = currentEquipped[mod.railSlot];
  let slotSwapNotice: string | undefined;

  if (currentModOnSlot && currentModOnSlot !== moduleId) {
    const oldMod = RIG_HARDWARE_MODULES[currentModOnSlot];
    const slotLabel =
      mod.railSlot === 'memory_1'
        ? 'Memory Rail 1'
        : mod.railSlot === 'memory_2'
        ? 'Memory Rail 2'
        : mod.railSlot === 'coprocessor'
        ? 'Co-Processor Socket'
        : 'Bus Interconnect';
    slotSwapNotice = `Replaces ${oldMod ? oldMod.name : currentModOnSlot} on your ${slotLabel} (You keep both in storage and can swap back anytime).`;
  }

  const baseStats = computeEffectiveRigStats(baselineNode, currentEquipped);
  const hypotheticalRig = equipRailModule(currentEquipped, mod.railSlot, moduleId);
  const previewStats = computeEffectiveRigStats(baselineNode, hypotheticalRig);

  const changes: HardwareStatPreview['changes'] = [];

  // Attempts change
  if (previewStats.maxAttempts !== baseStats.maxAttempts) {
    const delta = previewStats.maxAttempts - baseStats.maxAttempts;
    changes.push({
      label: 'Attempt Pips',
      before: `${baseStats.maxAttempts}`,
      after: `${previewStats.maxAttempts}`,
      delta: delta > 0 ? `+${delta} Attempt` : `${delta} Attempt`,
      tone: delta > 0 ? 'positive' : 'warning',
    });
  }

  // Timer change
  if (previewStats.timerSeconds !== baseStats.timerSeconds) {
    const delta = previewStats.timerSeconds - baseStats.timerSeconds;
    changes.push({
      label: 'Trace Timer',
      before: `${baseStats.timerSeconds}s`,
      after: `${previewStats.timerSeconds}s`,
      delta: delta > 0 ? `+${delta}s` : `${delta}s`,
      tone: delta > 0 ? 'positive' : 'warning',
    });
  }

  // Bounty change
  if (previewStats.bounty !== baseStats.bounty) {
    const delta = previewStats.bounty - baseStats.bounty;
    changes.push({
      label: 'Bounty Payout',
      before: `$${baseStats.bounty}`,
      after: `$${previewStats.bounty}`,
      delta: delta > 0 ? `+$${delta} (+20%)` : `-$${Math.abs(delta)}`,
      tone: delta > 0 ? 'positive' : 'warning',
    });
  }

  // Fine reduction change
  if (previewStats.fineReductionPercent !== baseStats.fineReductionPercent) {
    changes.push({
      label: 'Lockout Fine Penalty',
      before: `${100 - baseStats.fineReductionPercent}%`,
      after: `${100 - previewStats.fineReductionPercent}%`,
      delta: `-${previewStats.fineReductionPercent}% Fines`,
      tone: 'positive',
    });
  }

  // Dead digits pre-eliminated change
  if (previewStats.autoDeadDigitsCount !== baseStats.autoDeadDigitsCount) {
    changes.push({
      label: 'Keypad Pre-Filter',
      before: `${baseStats.autoDeadDigitsCount} Digits Purged`,
      after: `${previewStats.autoDeadDigitsCount} Digits Purged`,
      delta: `+${previewStats.autoDeadDigitsCount} Dead Digits Purged`,
      tone: 'positive',
    });
  }

  // Parity Scanner change
  if (previewStats.revealParityDistribution !== baseStats.revealParityDistribution) {
    changes.push({
      label: 'Parity Scanner Readout',
      before: 'OFF',
      after: 'LIVE [EVEN / ODD]',
      delta: 'Active',
      tone: 'positive',
    });
  }

  // Neural Reflex change
  if (previewStats.hasNeuralReflex !== baseStats.hasNeuralReflex) {
    changes.push({
      label: '4s Quick-Turn Refund',
      before: 'DISABLED',
      after: 'ACTIVE (1x / breach)',
      delta: 'Active',
      tone: 'positive',
    });
  }

  // Syndicate Skimmer change
  if (previewStats.hasSyndicateSkimmer !== baseStats.hasSyndicateSkimmer) {
    changes.push({
      label: 'Turn 1 Pan Siphon',
      before: '$0',
      after: '+$45 / Pan',
      delta: 'Active',
      tone: 'positive',
    });
  }

  return {
    moduleId,
    moduleName: mod.name,
    slot: mod.railSlot,
    changes,
    tradeOffNote: mod.tradeOff,
    slotSwapNotice,
  };
}

// ---------------------------------------------------------------------------
// 5. TERMINAL TOOL EXECUTION ENGINE
// ---------------------------------------------------------------------------

export interface ApplyTerminalToolParams {
  toolId: string;
  secret: string;
  eliminatedDigits?: string[];
  hasIceShield?: boolean;
  timerSeconds?: number;
  attemptsLeft?: number;
  tier?: number;
  history?: Array<{ guess: string; pots: number; pans: number }>;
  currentEntry?: string;
  revealedSlots?: number[];
  currentIce?: string;
}

export interface TerminalToolResult {
  success: boolean;
  toolId?: string;
  effectType?: string;
  eliminatedDigit?: string;
  hasDuplicates?: boolean;
  shieldArmed?: boolean;
  timeAddedSeconds?: number;
  timerFrozenSeconds?: number;
  timerFrozenMs?: number;
  cleanseTurns?: number;
  cleanseIce?: boolean;
  purgedIce?: boolean;
  uncorruptedScore?: { pots: number; pans: number };
  revealedClue?: { pots: number; pans: number; rawFeedback: string };
  extraAttempts?: number;
  revealedSlot?: { slotIndex: number; digit: string };
  autoCrack?: boolean;
  secret?: string;
  message?: string;
  error?: string;
}

export function applyTerminalTool(params: ApplyTerminalToolParams): TerminalToolResult {
  const {
    toolId,
    secret,
    eliminatedDigits = [],
    tier = 1,
    history = [],
    currentEntry,
    revealedSlots = [],
  } = params;
  const rule = TERMINAL_TOOL_RULES[toolId];

  if (!rule) {
    return {
      success: false,
      error: `Unknown terminal tool: ${toolId}`,
    };
  }

  const allDigits = '0123456789'.split('');

  switch (rule.effectType) {
    case 'eliminate_digit': {
      // Find candidate dead digits not in secret and not yet eliminated
      const candidateDead = allDigits.filter(
        (d) => !secret.includes(d) && !eliminatedDigits.includes(d)
      );

      if (candidateDead.length === 0) {
        return {
          success: true,
          toolId,
          effectType: 'eliminate_digit',
          message: 'All non-code digits have already been identified.',
        };
      }

      // Pick one dead digit deterministically
      const eliminated = candidateDead[0];
      return {
        success: true,
        toolId,
        effectType: 'eliminate_digit',
        eliminatedDigit: eliminated,
        message: `${rule.name} deployed: Digit [${eliminated}] confirmed dead and purged from keypad.`,
      };
    }

    case 'firewall_shield': {
      return {
        success: true,
        toolId,
        effectType: 'firewall_shield',
        shieldArmed: true,
        message: `${rule.name} armed: Defensive shield primed. Next ICE distortion neutralised.`,
      };
    }

    case 'add_time': {
      const seconds = toolId === 'exploit-time-freeze' ? 20 : 10;
      return {
        success: true,
        toolId,
        effectType: 'add_time',
        timeAddedSeconds: seconds,
        message: `${rule.name} injected: +${seconds} seconds added to security lockdown clock.`,
      };
    }

    case 'freeze_timer': {
      const freezeSeconds = rule.freezeDurationSeconds || (toolId === 'cryo_spike' ? 12 : 15);
      const freezeMs = rule.freezeDurationMs || freezeSeconds * 1000;
      return {
        success: true,
        toolId,
        effectType: 'freeze_timer',
        timerFrozenSeconds: freezeSeconds,
        timerFrozenMs: freezeMs,
        timeAddedSeconds: freezeSeconds,
        message: `${rule.name} detonated: Cryogenic pulse active. Clock frozen for ${freezeSeconds} seconds!`,
      };
    }

    case 'cleanse_ice': {
      let revealedClue: { pots: number; pans: number; rawFeedback: string } | undefined;
      if (history && history.length > 0) {
        const latest = history[history.length - 1];
        const raw = calculateScore(secret, latest.guess);
        revealedClue = {
          pots: raw.pots,
          pans: raw.pans,
          rawFeedback: `True Clues: ${raw.pans} PAN (Green exact) / ${raw.pots} POT (Amber misplaced)`,
        };
      }

      return {
        success: true,
        toolId,
        effectType: 'cleanse_ice',
        cleanseTurns: 2,
        purgedIce: true,
        revealedClue,
        message: revealedClue
          ? `Cleanse Subroutine executed: Malicious ICE purged for 2 turns. ${revealedClue.rawFeedback}.`
          : 'Cleanse Subroutine executed: Malicious ICE purged from terminal bus for 2 turns.',
      };
    }

    case 'extra_attempts': {
      return {
        success: true,
        toolId,
        effectType: 'extra_attempts',
        extraAttempts: 2,
        message: `${rule.name} deployed: +2 intrusion attempts injected into buffer.`,
      };
    }

    case 'second_chance': {
      return {
        success: true,
        toolId,
        effectType: 'second_chance',
        extraAttempts: 3,
        message: `${rule.name} deployed: Restored +3 emergency attempts with clue history intact.`,
      };
    }

    case 'slot_peek': {
      // Unmask the first unrevealed slot digit
      const secretChars = secret.split('');
      let targetSlot = 0;
      for (let i = 0; i < secretChars.length; i++) {
        if (!revealedSlots.includes(i)) {
          targetSlot = i;
          break;
        }
      }

      const revealedDigit = secretChars[targetSlot] || secretChars[0];
      return {
        success: true,
        toolId,
        effectType: 'slot_peek',
        revealedSlot: {
          slotIndex: targetSlot,
          digit: revealedDigit,
        },
        message: `${rule.name} unmasked: Slot [${targetSlot + 1}] is confirmed to be digit [${revealedDigit}].`,
      };
    }

    case 'contradiction_scan': {
      if (currentEntry && currentEntry.length === secret.length && history.length > 0) {
        const check = checkContradiction(currentEntry, history);
        if (!check.isConsistent) {
          return {
            success: true,
            toolId,
            effectType: 'contradiction_scan',
            message: `Contradiction Alert: ${check.reason}`,
          };
        }
        return {
          success: true,
          toolId,
          effectType: 'contradiction_scan',
          message: `Contradiction Scan: Entry [${currentEntry}] is mathematically consistent with all prior clues.`,
        };
      }

      return {
        success: true,
        toolId,
        effectType: 'contradiction_scan',
        message: 'Contradiction Scan active: Clue consistency monitor armed.',
      };
    }

    case 'skeleton_key': {
      if (tier > 2) {
        return {
          success: false,
          error: 'Skeleton Key can only bypass Tier 1 or Tier 2 nodes.',
        };
      }

      return {
        success: true,
        toolId,
        effectType: 'skeleton_key',
        autoCrack: true,
        secret,
        message: 'Skeleton Key deployed: Master cryptographic bypass accepted. Node breached!',
      };
    }

    case 'detect_duplicates': {
      const secretDigits = secret.split('');
      const uniqueDigits = new Set(secretDigits);
      const hasDuplicates = uniqueDigits.size !== secretDigits.length;

      return {
        success: true,
        toolId,
        effectType: 'detect_duplicates',
        hasDuplicates,
        message: hasDuplicates
          ? 'Signal Sniffer probe: Duplicate digits detected in the target code!'
          : 'Signal Sniffer probe: Confirmed all digits in the target code are unique.',
      };
    }

    case 'probe_parity': {
      const sum = secret.split('').reduce((acc, ch) => acc + parseInt(ch, 10), 0);
      const isEven = sum % 2 === 0;
      return {
        success: true,
        toolId,
        effectType: 'probe_parity',
        message: `Frequency Probe: Carrier bus harmonic confirmed digit sum is ${isEven ? 'EVEN' : 'ODD'} (${isEven ? '2n' : '2n+1'}).`,
      };
    }

    case 'blackout_ping': {
      return {
        success: true,
        toolId,
        effectType: 'blackout_ping',
        message: `${rule.name} pulsed: Terminal telemetry blindspot active.`,
      };
    }

    case 'false_flag_echo': {
      return {
        success: true,
        toolId,
        effectType: 'false_flag_echo',
        message: `${rule.name} transmitted: Decoy trace echo deployed to ICE daemon.`,
      };
    }

    default:
      return {
        success: false,
        error: `Unhandled tool effect: ${(rule as any).effectType}`,
      };
  }
}
