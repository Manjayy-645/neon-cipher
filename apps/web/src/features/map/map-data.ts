// Icon SVG inner content (goes inside <svg viewBox="0 0 24 24">)
export const GLYPHS: Record<string, string> = {
  atm: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="5.5" width="8" height="5"/><path d="M8 14h2M12 14h4M8 17.5h8"/>',
  vending: '<rect x="4.5" y="2.5" width="15" height="19" rx="1.5"/><rect x="7" y="5" width="7" height="9"/><path d="M16.5 6.5v3M8 17.5h8"/>',
  register: '<path d="M4.5 20h15v-6h-15zM6.5 14l1.5-5h8l1.5 5M9.5 9V5h5v4M8 17h2M12 17h4"/>',
  camera: '<rect x="3" y="6" width="13" height="6" rx="1" transform="rotate(-14 9 9)"/><path d="M16 10.5l4 2.5M11 13.5L9 19.5h5"/>',
  meter: '<circle cx="12" cy="8.5" r="5.5"/><path d="M10 8h4M12 14v7M9 21h6"/>',
  relay: '<path d="M12 10.5L7 21M12 10.5L17 21M9 16.5h6M10 13.5h4"/><circle cx="12" cy="8" r="1.5"/><path d="M8.5 5a5 5 0 0 0 0 6M15.5 5a5 5 0 0 1 0 6"/>',
  safe: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5v7M8.5 12h7M20.5 9v1.5M20.5 14v1.5"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
};

export type NodeStatus = 'available' | 'owned' | 'contested' | 'cooldown';

export interface MapNode {
  id: string;
  n: string; // name
  t: string; // glyph type key
  tier: number;
  z: 'S' | 'C'; // zone: S=Slums, C=Commercial
  x: number; // percent position
  y: number;
  st: NodeStatus;
  cd?: number; // cooldown seconds remaining
}

export interface TierConfig {
  d: number; // digits
  dup: 0 | 1; // duplicates allowed
  tries: number;
  secs: number;
  b: number; // bounty
}

export const TIERS: Record<number, TierConfig> = {
  1: { d: 3, dup: 0, tries: 8, secs: 90, b: 120 },
  2: { d: 4, dup: 0, tries: 7, secs: 60, b: 650 },
  3: { d: 4, dup: 1, tries: 6, secs: 45, b: 2800 },
};

export const NODES: MapNode[] = [
  { id: 's1', n: 'Rust Lane Vending', t: 'vending', tier: 1, z: 'S', x: 20, y: 12, st: 'available' },
  { id: 's2', n: 'Tin Alley Parking Meter', t: 'meter', tier: 1, z: 'S', x: 16, y: 27, st: 'available' },
  { id: 's3', n: 'Scrapyard CCTV Relay', t: 'camera', tier: 2, z: 'S', x: 35, y: 26, st: 'contested' },
  { id: 's4', n: 'Soap Row Vending', t: 'vending', tier: 1, z: 'S', x: 20, y: 46, st: 'cooldown', cd: 930 },
  { id: 's5', n: 'St. Jude Corner Store Register', t: 'register', tier: 2, z: 'S', x: 32, y: 51, st: 'available' },
  { id: 's6', n: 'Chop-Shop Safe', t: 'safe', tier: 3, z: 'S', x: 32, y: 66, st: 'contested' },
  { id: 's7', n: 'Gutter St. Vending', t: 'vending', tier: 1, z: 'S', x: 13, y: 76, st: 'available' },
  { id: 's8', n: 'Water Tower Relay', t: 'relay', tier: 1, z: 'S', x: 27, y: 87, st: 'available' },
  { id: 'c1', n: 'Meridian Ave ATM', t: 'atm', tier: 2, z: 'C', x: 73, y: 22, st: 'available' },
  { id: 'c2', n: 'Plaza CCTV Relay', t: 'camera', tier: 1, z: 'C', x: 62, y: 30, st: 'available' },
  { id: 'c3', n: 'Fenwick Market Register', t: 'register', tier: 2, z: 'C', x: 74, y: 35, st: 'available' },
  { id: 'c4', n: 'Canal Bank ATM', t: 'atm', tier: 2, z: 'C', x: 62, y: 60, st: 'cooldown', cd: 2710 },
  { id: 'c5', n: 'Civic Parking Meter 9', t: 'meter', tier: 1, z: 'C', x: 75, y: 58, st: 'available' },
  { id: 'c6', n: 'Northgate Relay Tower', t: 'relay', tier: 3, z: 'C', x: 64, y: 81, st: 'available' },
  { id: 'c7', n: 'Corner Mart Register', t: 'register', tier: 2, z: 'C', x: 77, y: 93, st: 'owned' },
];

export const SAY: Record<number, string> = {
  1: 'Easy money. Three digits, no repeats.',
  2: 'Signal stable. Lock is local.',
  3: 'Corporate lock. Digits can repeat here.',
};

export const DISTRICTS = [
  { zone: 'S' as const, name: 'Slums', x: 27, y: 48 },
  { zone: 'C' as const, name: 'Commercial', x: 70, y: 45 },
];

export function fmtTime(s: number): string {
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
