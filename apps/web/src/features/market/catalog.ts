import { HardwareRailSlot, RigHardwareId } from '@neon-cipher/game-rules';

export type Currency = 'credits' | 'coins';
export type ItemCategory = 'tools' | 'exploits' | 'rig' | 'leases';

export interface CatalogItem {
  id: string;
  name: string;
  category: ItemCategory;
  currency: Currency;
  price: number;
  effect: string;
  icon?: string;
  bountyPenaltyPercent?: number; // For Exploits: e.g. 15% reduction
  maxOwned?: number; // undefined = consumable / stackable
  tierRequired?: number;
  railSlot?: HardwareRailSlot;
  buildArchetype?: string;
  mechanicalEffect?: string;
  tradeOff?: string;
  alexExplanation?: string;
  nixTip?: string;
  glitchPitch?: string;
  recommendedWhen?: string;
}

export const CATALOG: CatalogItem[] = [
  // --- UTILITY & SABOTAGE TOOLS (Consumable breach tools, currency: credits) ---
  {
    id: 'cryo_spike',
    name: 'Cryo-Spike',
    category: 'tools',
    currency: 'credits',
    price: 375,
    effect: 'Freezes active ICE trace countdown clock for 12 seconds during breach.',
    icon: '/icons/icon-cryo-spike.svg',
    glitchPitch: 'Sub-zero liquid nitrogen coolant needle. Overrides internal thermal sensors and buys you 12 cold seconds.',
    nixTip: 'Need time to think? Pop a Cryo-Spike to freeze the countdown clock for 12 seconds while you work out the math.',
    recommendedWhen: 'Best used on Tier 3–5 vaults with tight 30s–45s timers.',
  },
  {
    id: 'cleanse_subroutine',
    name: 'Cleanse Subroutine',
    category: 'tools',
    currency: 'credits',
    price: 425,
    effect: 'Purges active Liar, Drift, or Ghost ICE for 2 turns and reveals uncorrupted Pan/Pot counts.',
    icon: '/icons/glyph-router.svg',
    glitchPitch: 'Deep kernel diagnostic purge. Flushes corporate heuristics down the drain before they cook your clues.',
    nixTip: 'If a corporate node is lying to you or hiding clue dots, run this subroutine to scrub the virus and see the real numbers.',
    recommendedWhen: 'Mandatory when tackling Commercial Strip nodes with active ICE defenses.',
  },
  {
    id: 'tool-static-injector',
    name: 'Static Injector',
    category: 'tools',
    currency: 'credits',
    price: 300,
    effect: 'Scrambles opponent keypad positions for their next guess.',
    icon: '/icons/icon-static-injector.svg',
  },
  {
    id: 'tool-frequency-probe',
    name: 'Frequency Probe',
    category: 'tools',
    currency: 'credits',
    price: 400,
    effect: 'Probes carrier bus harmonics to calculate whether the digit sum is even or odd.',
    icon: '/icons/glyph-router.svg',
  },
  {
    id: 'tool-firewall-patch',
    name: 'Firewall Patch',
    category: 'tools',
    currency: 'credits',
    price: 450,
    effect: 'Blocks the next incoming sabotage attack during breach.',
    icon: '/icons/icon-firewall-patch.svg',
  },
  {
    id: 'tool-blackout-ping',
    name: 'Blackout Ping',
    category: 'tools',
    currency: 'credits',
    price: 550,
    effect: 'Blinds terminal clue history for 6 seconds.',
    icon: '/icons/icon-blackout-ping.svg',
  },
  {
    id: 'tool-signal-sniffer',
    name: 'Signal Sniffer',
    category: 'tools',
    currency: 'credits',
    price: 600,
    effect: 'Probes node carrier frequency to confirm whether digits repeat.',
    icon: '/icons/glyph-router.svg',
  },
  {
    id: 'tool-snoop-packet',
    name: 'Snoop Packet',
    category: 'tools',
    currency: 'credits',
    price: 750,
    effect: "Reveals the result of an opponent's hidden move.",
    icon: '/icons/icon-snoop-packet.svg',
  },
  {
    id: 'tool-trace-accelerator',
    name: 'Trace Accelerator',
    category: 'tools',
    currency: 'credits',
    price: 800,
    effect: 'Removes 10 seconds from security lockdown clock.',
    icon: '/icons/icon-trace-accelerator.svg',
  },
  {
    id: 'tool-cryo-pulse',
    name: 'Cryo-Pulse Spike',
    category: 'tools',
    currency: 'credits',
    price: 950,
    effect: 'Injects a cryogenic pulse that freezes the ICE countdown clock for 15 seconds.',
    icon: '/icons/tool-cryo-pulse.svg',
    tierRequired: 3,
  },
  {
    id: 'tool-zero-day',
    name: 'Zero-Day Exploit',
    category: 'tools',
    currency: 'credits',
    price: 1250,
    effect: 'Unmasks 1 confirmed correct code digit in its exact slot position.',
    icon: '/icons/glyph-camera.svg',
    tierRequired: 4,
  },
  {
    id: 'tool-false-flag-echo',
    name: 'False Flag Echo',
    category: 'tools',
    currency: 'credits',
    price: 1100,
    effect: 'Fakes your public Pot/Pan clue result for one turn.',
    icon: '/icons/icon-false-flag-echo.svg',
  },

  // --- EXPLOITS (Solo hacks only, currency: coins) ---
  {
    id: 'exploit-digit-scrub',
    name: 'Digit Scrub',
    category: 'exploits',
    currency: 'coins',
    price: 5,
    effect: 'Reveals one digit that is guaranteed NOT in the cipher.',
    icon: '/icons/icon-digit-scrub.svg',
    bountyPenaltyPercent: 15,
  },
  {
    id: 'exploit-time-freeze',
    name: 'Time Freeze',
    category: 'exploits',
    currency: 'coins',
    price: 8,
    effect: 'Freezes the ICE countdown timer for 20 seconds.',
    icon: '/icons/icon-time-freeze.svg',
    bountyPenaltyPercent: 15,
  },
  {
    id: 'exploit-extra-cycle',
    name: 'Extra Cycle',
    category: 'exploits',
    currency: 'coins',
    price: 10,
    effect: 'Grants +2 extra guess attempts to this intrusion session.',
    icon: '/icons/icon-extra-cycle.svg',
    bountyPenaltyPercent: 15,
  },
  {
    id: 'exploit-contradiction-scan',
    name: 'Contradiction Scan',
    category: 'exploits',
    currency: 'coins',
    price: 12,
    effect: 'Highlights mathematically conflicting guesses in red.',
    icon: '/icons/icon-contradiction-scan.svg',
    bountyPenaltyPercent: 15,
  },
  {
    id: 'exploit-slot-peek',
    name: 'Slot Peek',
    category: 'exploits',
    currency: 'coins',
    price: 15,
    effect: 'Directly unmasks the exact digit for one chosen slot.',
    icon: '/icons/icon-slot-peek.svg',
    bountyPenaltyPercent: 20,
  },
  {
    id: 'exploit-second-chance',
    name: 'Second Chance',
    category: 'exploits',
    currency: 'coins',
    price: 20,
    effect: 'Instantly retries a failed node with full clue history intact.',
    icon: '/icons/icon-second-chance.svg',
    bountyPenaltyPercent: 25,
  },
  {
    id: 'exploit-skeleton-key',
    name: 'Skeleton Key',
    category: 'exploits',
    currency: 'coins',
    price: 35,
    effect: 'Auto-cracks any Tier 1 or 2 node immediately (Zero bounty payout).',
    icon: '/icons/icon-skeleton-key.svg',
    bountyPenaltyPercent: 100,
  },

  // --- 4-RAIL CYBERDECK HARDWARE (Permanent upgrades, currency: credits) ---
  {
    id: 'memory_buffer_mk1',
    name: 'Memory Buffer Mk I',
    category: 'rig',
    currency: 'credits',
    price: 650,
    railSlot: 'memory_1',
    buildArchetype: 'Balanced / Rookie',
    effect: '+1 max guess attempt on Tier 1 & Tier 2 nodes.',
    mechanicalEffect: '+1 max guess attempt on Tier 1 & Tier 2 nodes.',
    tradeOff: 'No attempt bonus on Tier 3+ corporate nodes.',
    alexExplanation: "Solid starter RAM. Gives you one extra try on street locks so a bad guess doesn't fry your run.",
    nixTip: 'Gives you breathing room on street terminals. An extra probe before ICE trips.',
    glitchPitch: 'Street-grade RAM chips pulled from defunct ATMs. Reliable, simple, and cheap.',
    icon: '/icons/icon-memory-buffer.svg',
    maxOwned: 1,
  },
  {
    id: 'neural_reflex_cap',
    name: 'Neural Reflex Capacitor',
    category: 'rig',
    currency: 'credits',
    price: 2800,
    railSlot: 'memory_1',
    buildArchetype: 'Speed / Duelist',
    effect: 'Submitting a guess within 4 seconds of your previous turn does not consume an attempt pip (Triggers max once per breach).',
    mechanicalEffect: 'Submitting a guess within 4 seconds of your previous turn does not consume an attempt pip (Triggers max once per breach).',
    tradeOff: 'Requires quick decision making; triggers at most once per breach.',
    alexExplanation: 'Built for fast fingers. Punch your follow-up guess in under 4 seconds and the capacitor gives you that turn for free.',
    nixTip: 'If your deduction is mapped out ahead of time, double-tap quickly to earn a free turn.',
    glitchPitch: 'Military twitch-capacitors wired straight into optical relays. Rewards split-second execution.',
    icon: '/icons/icon-trace-accelerator.svg',
    maxOwned: 1,
  },
  {
    id: 'memory_buffer_mk2',
    name: 'Memory Buffer Mk II',
    category: 'rig',
    currency: 'credits',
    price: 2200,
    railSlot: 'memory_2',
    buildArchetype: 'Deep Breaker',
    effect: '+1 max guess attempt on Tier 3, Tier 4 & Tier 5 nodes.',
    mechanicalEffect: '+1 max guess attempt on Tier 3, Tier 4 & Tier 5 nodes.',
    tradeOff: 'High heat density; provides no bonus on Tier 1 or 2 street locks.',
    alexExplanation: 'Heavy-duty buffer for corporate vaults where every single attempt counts.',
    nixTip: 'High-spec memory rail for corporate relays. Protects against tight attempt limits.',
    glitchPitch: 'Enterprise server cache modules. When you hit downtown databanks, you will thank me.',
    icon: '/icons/icon-memory-buffer.svg',
    maxOwned: 1,
  },
  {
    id: 'syndicate_skimmer',
    name: 'Syndicate Skimmer Chip',
    category: 'rig',
    currency: 'credits',
    price: 3100,
    railSlot: 'memory_2',
    buildArchetype: 'Cash Farmer',
    effect: 'Every Pan (Green exact match) scored on your very first guess immediately deposits a $45 bonus into your wallet, win or lose.',
    mechanicalEffect: 'Every Pan (Green exact match) scored on your very first guess immediately deposits a $45 bonus into your wallet, win or lose.',
    tradeOff: 'Occupies Memory Rail 2; gives up the +1 attempt buffer of Memory Buffer Mk II.',
    alexExplanation: 'Siphons loose credits right off the first handshake. Great for farming quick cash in The Slums.',
    nixTip: 'Lead with diverse high-frequency probe digits on Turn 1 to maximize early Pan payouts.',
    glitchPitch: 'Custom Kovacs firmware tap. Turns initial cryptographic syncs into pure street money.',
    icon: '/icons/icon-syndicate-skimmer.svg',
    maxOwned: 1,
  },
  {
    id: 'heuristic_coproc',
    name: 'Heuristic Co-Processor',
    category: 'rig',
    currency: 'credits',
    price: 1500,
    railSlot: 'coprocessor',
    buildArchetype: 'Eliminator',
    effect: 'Automatically crosses off and dims 2 confirmed dead digits on the keypad as soon as you jack in.',
    mechanicalEffect: 'Automatically crosses off and dims 2 confirmed dead digits on the keypad as soon as you jack in.',
    tradeOff: 'Occupies Co-Processor socket; cannot equip Parity Scanner ASIC simultaneously.',
    alexExplanation: 'Cuts the guesswork down before you even touch a key. Removes two dead numbers right on boot.',
    nixTip: 'Instantly burns away two false digits right when you jack in. Cuts guesswork in half.',
    glitchPitch: 'Pre-flight signal filter that purges dead carrier noise before you even touch the keys.',
    icon: '/icons/icon-heuristic-coprocessor.svg',
    maxOwned: 1,
  },
  {
    id: 'parity_scanner_asic',
    name: 'Parity Scanner ASIC',
    category: 'rig',
    currency: 'credits',
    price: 1800,
    railSlot: 'coprocessor',
    buildArchetype: 'Analytical',
    effect: 'On boot, displays the exact count of EVEN vs. ODD digits in the secret code (e.g., [2 EVEN / 2 ODD]).',
    mechanicalEffect: 'On boot, displays the exact count of EVEN vs. ODD digits in the secret code (e.g., [2 EVEN / 2 ODD]).',
    tradeOff: 'Does not eliminate digits directly; relies on player mathematical deduction.',
    alexExplanation: 'Instead of crossing off two numbers, this tells you the exact balance of Even and Odd numbers in the lock.',
    nixTip: 'Even numbers are 0, 2, 4, 6, 8. Odd numbers are 1, 3, 5, 7, 9. Use this distribution to structure your probes.',
    glitchPitch: 'Dedicated ASIC math coprocessor that sniffs bus parity harmonics in micro-seconds.',
    icon: '/icons/glyph-router.svg',
    maxOwned: 1,
  },
  {
    id: 'overclocked_quartz_bus',
    name: 'Overclocked Quartz Bus',
    category: 'rig',
    currency: 'credits',
    price: 2400,
    railSlot: 'bus_interconnect',
    buildArchetype: 'High-Risk Blitz',
    effect: 'Grants +15 seconds to all trace timers and +20% Credit Bounty, but reduces max attempts by -1 (min 3 attempts).',
    mechanicalEffect: 'Grants +15 seconds to all trace timers and +20% Credit Bounty, but reduces max attempts by -1 (min 3 attempts).',
    tradeOff: 'Runs hot—reduces max attempts by 1 attempt.',
    alexExplanation: 'Pushes your clock and payout through the roof, but runs hot—costs you 1 attempt slot. Only equip if your deduction is sharp.',
    nixTip: 'High-risk, high-reward interconnect. The extra clock lets you think, but you have fewer attempts to fail.',
    glitchPitch: 'Over-volted quartz oscillator. Drives up the score and buys you clock time, if you can stand the heat.',
    icon: '/icons/icon-stopwatch.svg',
    maxOwned: 1,
  },
  {
    id: 'lead_shielded_chassis',
    name: 'Lead-Shielded Chassis',
    category: 'rig',
    currency: 'credits',
    price: 1950,
    railSlot: 'bus_interconnect',
    buildArchetype: 'Tank / Low-Heat',
    effect: 'Reduces failure fines by 60%, cuts Sector Heat buildup by 50%, and prevents hardware burn on Tier 5 lockouts.',
    mechanicalEffect: 'Reduces failure fines by 60%, cuts Sector Heat buildup by 50%, and prevents hardware burn on Tier 5 lockouts.',
    tradeOff: 'No timer extensions or bounty payout multipliers.',
    alexExplanation: 'Heavy lead lining. If a tough vault locks you out, you barely pay a fine and your rig stays safe from burn damage.',
    nixTip: 'Defensive chassis plating. Essential when probing high-security nodes where failure penalties are brutal.',
    glitchPitch: 'Military-grade lead plating. Security trace spikes bounce right off your deck casing.',
    icon: '/icons/icon-firewall-patch.svg',
    maxOwned: 1,
  },

  // --- LEGACY HARDWARE ALIASES (Retained for backwards compatibility) ---
  {
    id: 'rig-memory-buffer-1',
    name: 'Memory Buffer Mk I',
    category: 'rig',
    currency: 'credits',
    price: 650,
    railSlot: 'memory_1',
    buildArchetype: 'Balanced / Rookie',
    effect: '+1 maximum attempt on Tier 1 and 2 nodes permanently.',
    icon: '/icons/icon-memory-buffer.svg',
    maxOwned: 1,
  },
  {
    id: 'rig-heuristic-coprocessor',
    name: 'Heuristic Co-Processor',
    category: 'rig',
    currency: 'credits',
    price: 1500,
    railSlot: 'coprocessor',
    buildArchetype: 'Eliminator',
    effect: 'Automatically eliminates two non-code digits at hack start.',
    icon: '/icons/icon-heuristic-coprocessor.svg',
    maxOwned: 1,
  },
  {
    id: 'rig-memory-buffer-2',
    name: 'Memory Buffer Mk II',
    category: 'rig',
    currency: 'credits',
    price: 2200,
    railSlot: 'memory_2',
    buildArchetype: 'Deep Breaker',
    effect: '+1 maximum attempt on Tier 3 and 4 nodes permanently.',
    icon: '/icons/icon-memory-buffer.svg',
    maxOwned: 1,
  },
  {
    id: 'rig-safehouse-slums',
    name: 'Slums Safehouse Bunker',
    category: 'rig',
    currency: 'credits',
    price: 15000,
    effect: 'Reduces trace penalty fines by 50% and passively scrubs Heat.',
    icon: '/icons/icon-safehouse.svg',
    maxOwned: 1,
  },
  {
    id: 'rig-heat-dispersal-sink',
    name: 'Heat Dispersal Sink',
    category: 'rig',
    currency: 'credits',
    price: 5500,
    effect: 'Dissipates deck thermals, reducing trace risk penalties by 25% on failed incursions.',
    icon: '/icons/icon-stopwatch.svg',
    maxOwned: 1,
  },

  // --- DISTRICT LEASES (Passive revenue, currency: credits) ---
  {
    id: 'lease-slums-nodes',
    name: 'Slums Public Node Lease',
    category: 'leases',
    currency: 'credits',
    price: 5000,
    effect: 'Yields daily credit dividend ($250/day) from 3 Slums sub-nodes.',
    icon: '/icons/glyph-terminal.svg',
    maxOwned: 1,
  },
  {
    id: 'lease-docklands-pier',
    name: 'Docklands Container Pier Lease',
    category: 'leases',
    currency: 'credits',
    price: 9500,
    effect: 'Yields daily credit dividend ($400/day) from automated freight relays.',
    icon: '/icons/glyph-vault.svg',
    maxOwned: 1,
  },
  {
    id: 'lease-corridor-transit',
    name: 'Industrial Corridor Transit Lease',
    category: 'leases',
    currency: 'credits',
    price: 18000,
    effect: 'Reduces hack cooldowns across the industrial sector by 50%.',
    icon: '/icons/glyph-relay.svg',
    maxOwned: 1,
  },
  {
    id: 'lease-commercial-relay',
    name: 'Commercial High-Bounty Relay Lease',
    category: 'leases',
    currency: 'credits',
    price: 25000,
    effect: 'Grants access to encrypted Commercial sector syndication feeds.',
    icon: '/icons/glyph-server.svg',
    maxOwned: 1,
  },
];

export function getItemIcon(itemId: string): string {
  const item = CATALOG.find((it) => it.id === itemId);
  if (item?.icon) return item.icon;
  if (itemId.includes('static-injector')) return '/icons/icon-static-injector.svg';
  if (itemId.includes('frequency-probe')) return '/icons/glyph-router.svg';
  if (itemId.includes('firewall-patch')) return '/icons/icon-firewall-patch.svg';
  if (itemId.includes('blackout-ping')) return '/icons/icon-blackout-ping.svg';
  if (itemId.includes('snoop-packet')) return '/icons/icon-snoop-packet.svg';
  if (itemId.includes('trace-accelerator')) return '/icons/icon-trace-accelerator.svg';
  if (itemId.includes('false-flag-echo')) return '/icons/icon-false-flag-echo.svg';
  if (itemId.includes('digit-scrub')) return '/icons/icon-digit-scrub.svg';
  if (itemId.includes('slot-peek')) return '/icons/icon-slot-peek.svg';
  if (itemId.includes('extra-cycle')) return '/icons/icon-extra-cycle.svg';
  if (itemId.includes('time-freeze')) return '/icons/icon-time-freeze.svg';
  if (itemId.includes('contradiction-scan')) return '/icons/icon-contradiction-scan.svg';
  if (itemId.includes('skeleton-key')) return '/icons/icon-skeleton-key.svg';
  if (itemId.includes('cryo_spike') || itemId.includes('cryo-spike')) return '/icons/icon-cryo-spike.svg';
  if (itemId.includes('cryo-pulse') || itemId.includes('cryo_pulse')) return '/icons/tool-cryo-pulse.svg';
  if (itemId.includes('cleanse_subroutine') || itemId.includes('cleanse-subroutine')) return '/icons/glyph-router.svg';
  if (itemId.includes('neural_reflex') || itemId.includes('neural-reflex')) return '/icons/icon-trace-accelerator.svg';
  if (itemId.includes('syndicate_skimmer') || itemId.includes('syndicate-skimmer')) return '/icons/icon-syndicate-skimmer.svg';
  if (itemId.includes('parity_scanner') || itemId.includes('parity-scanner')) return '/icons/glyph-router.svg';
  if (itemId.includes('overclocked_quartz') || itemId.includes('overclocked-quartz')) return '/icons/icon-stopwatch.svg';
  if (itemId.includes('lead_shielded') || itemId.includes('lead-shielded')) return '/icons/icon-firewall-patch.svg';
  if (itemId.includes('memory_buffer') || itemId.includes('memory-buffer')) return '/icons/icon-memory-buffer.svg';
  if (itemId.includes('heuristic_coproc') || itemId.includes('heuristic-coprocessor')) return '/icons/icon-heuristic-coprocessor.svg';
  if (itemId.includes('heat-dispersal-sink')) return '/icons/icon-stopwatch.svg';
  if (itemId.includes('safehouse')) return '/icons/icon-safehouse.svg';
  if (itemId.includes('docklands')) return '/icons/glyph-vault.svg';
  return '/icons/glyph-terminal.svg';
}
