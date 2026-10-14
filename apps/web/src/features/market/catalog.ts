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

  // --- RIG HARDWARE (Permanent upgrades, currency: credits) ---
  {
    id: 'rig-memory-buffer-1',
    name: 'Memory Buffer Mk I',
    category: 'rig',
    currency: 'credits',
    price: 2500,
    effect: '+1 maximum attempt on Tier 1 and 2 nodes permanently.',
    icon: '/icons/icon-memory-buffer.svg',
    maxOwned: 1,
  },
  {
    id: 'rig-heuristic-coprocessor',
    name: 'Heuristic Co-Processor',
    category: 'rig',
    currency: 'credits',
    price: 8500,
    effect: 'Automatically eliminates two non-code digits at hack start.',
    icon: '/icons/icon-heuristic-coprocessor.svg',
    maxOwned: 1,
  },
  {
    id: 'rig-memory-buffer-2',
    name: 'Memory Buffer Mk II',
    category: 'rig',
    currency: 'credits',
    price: 12000,
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
  if (itemId.includes('second-chance')) return '/icons/icon-second-chance.svg';
  if (itemId.includes('memory-buffer')) return '/icons/icon-memory-buffer.svg';
  if (itemId.includes('heuristic-coprocessor')) return '/icons/icon-heuristic-coprocessor.svg';
  if (itemId.includes('heat-dispersal-sink')) return '/icons/icon-stopwatch.svg';
  if (itemId.includes('safehouse')) return '/icons/icon-safehouse.svg';
  if (itemId.includes('docklands')) return '/icons/glyph-vault.svg';
  return '/icons/glyph-terminal.svg';
}
