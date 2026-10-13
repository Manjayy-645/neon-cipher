export type Currency = 'credits' | 'coins';
export type ItemCategory = 'tools' | 'exploits' | 'rig' | 'leases';

export interface CatalogItem {
  id: string;
  name: string;
  category: ItemCategory;
  currency: Currency;
  price: number;
  effect: string;
  bountyPenaltyPercent?: number; // For Exploits: e.g. 15% reduction
  maxOwned?: number; // undefined = consumable / stackable
  tierRequired?: number;
}

export const CATALOG: CatalogItem[] = [
  // --- TOOLS (Consumable sabotage tools, currency: credits) ---
  {
    id: 'tool-static-injector',
    name: 'Static Injector',
    category: 'tools',
    currency: 'credits',
    price: 300,
    effect: 'Scrambles opponent keypad positions for their next guess.',
  },
  {
    id: 'tool-firewall-patch',
    name: 'Firewall Patch',
    category: 'tools',
    currency: 'credits',
    price: 450,
    effect: 'Blocks the next incoming sabotage attack during breach.',
  },
  {
    id: 'tool-blackout-ping',
    name: 'Blackout Ping',
    category: 'tools',
    currency: 'credits',
    price: 550,
    effect: 'Blinds terminal clue history for 6 seconds.',
  },
  {
    id: 'tool-signal-sniffer',
    name: 'Signal Sniffer',
    category: 'tools',
    currency: 'credits',
    price: 600,
    effect: 'Probes node carrier frequency to confirm whether digits repeat.',
  },
  {
    id: 'tool-snoop-packet',
    name: 'Snoop Packet',
    category: 'tools',
    currency: 'credits',
    price: 750,
    effect: "Reveals the result of an opponent's hidden move.",
  },
  {
    id: 'tool-trace-accelerator',
    name: 'Trace Accelerator',
    category: 'tools',
    currency: 'credits',
    price: 800,
    effect: 'Removes 10 seconds from security lockdown clock.',
  },
  {
    id: 'tool-false-flag-echo',
    name: 'False Flag Echo',
    category: 'tools',
    currency: 'credits',
    price: 1100,
    effect: 'Fakes your public Pot/Pan clue result for one turn.',
  },

  // --- EXPLOITS (Solo hacks only, currency: coins) ---
  {
    id: 'exploit-digit-scrub',
    name: 'Digit Scrub',
    category: 'exploits',
    currency: 'coins',
    price: 5,
    effect: 'Reveals one digit that is guaranteed NOT in the cipher.',
    bountyPenaltyPercent: 15,
  },
  {
    id: 'exploit-time-freeze',
    name: 'Time Freeze',
    category: 'exploits',
    currency: 'coins',
    price: 8,
    effect: 'Freezes the ICE countdown timer for 20 seconds.',
    bountyPenaltyPercent: 15,
  },
  {
    id: 'exploit-extra-cycle',
    name: 'Extra Cycle',
    category: 'exploits',
    currency: 'coins',
    price: 10,
    effect: 'Grants +2 extra guess attempts to this intrusion session.',
    bountyPenaltyPercent: 15,
  },
  {
    id: 'exploit-contradiction-scan',
    name: 'Contradiction Scan',
    category: 'exploits',
    currency: 'coins',
    price: 12,
    effect: 'Highlights mathematically conflicting guesses in red.',
    bountyPenaltyPercent: 15,
  },
  {
    id: 'exploit-slot-peek',
    name: 'Slot Peek',
    category: 'exploits',
    currency: 'coins',
    price: 15,
    effect: 'Directly unmasks the exact digit for one chosen slot.',
    bountyPenaltyPercent: 15,
  },
  {
    id: 'exploit-second-chance',
    name: 'Second Chance',
    category: 'exploits',
    currency: 'coins',
    price: 20,
    effect: 'Instantly retries a failed node with full clue history intact.',
    bountyPenaltyPercent: 20,
  },
  {
    id: 'exploit-skeleton-key',
    name: 'Skeleton Key',
    category: 'exploits',
    currency: 'coins',
    price: 40,
    effect: 'Auto-cracks any Tier 1 or 2 node immediately (Zero bounty payout).',
    bountyPenaltyPercent: 100,
  },

  // --- RIG HARDWARE (Permanent upgrades, currency: credits) ---
  {
    id: 'rig-memory-buffer-1',
    name: 'Memory Buffer Mk I',
    category: 'rig',
    currency: 'credits',
    price: 2500,
    effect: '+1 maximum attempt on Tier 1 and 2 nodes permanently.',
    maxOwned: 1,
  },
  {
    id: 'rig-heuristic-coprocessor',
    name: 'Heuristic Co-Processor',
    category: 'rig',
    currency: 'credits',
    price: 8500,
    effect: 'Automatically eliminates two non-code digits at hack start.',
    maxOwned: 1,
  },
  {
    id: 'rig-memory-buffer-2',
    name: 'Memory Buffer Mk II',
    category: 'rig',
    currency: 'credits',
    price: 12000,
    effect: '+1 maximum attempt on Tier 3 and 4 nodes permanently.',
    maxOwned: 1,
  },
  {
    id: 'rig-safehouse-slums',
    name: 'Slums Safehouse Bunker',
    category: 'rig',
    currency: 'credits',
    price: 15000,
    effect: 'Reduces trace penalty fines by 50% and passively scrubs Heat.',
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
    maxOwned: 1,
  },
  {
    id: 'lease-corridor-transit',
    name: 'Industrial Corridor Transit Lease',
    category: 'leases',
    currency: 'credits',
    price: 18000,
    effect: 'Reduces hack cooldowns across the industrial sector by 50%.',
    maxOwned: 1,
  },
  {
    id: 'lease-commercial-relay',
    name: 'Commercial High-Bounty Relay Lease',
    category: 'leases',
    currency: 'credits',
    price: 25000,
    effect: 'Grants access to encrypted Commercial sector syndication feeds.',
    maxOwned: 1,
  },
];
