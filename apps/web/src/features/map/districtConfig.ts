export type DistrictId = 'slums' | 'commercial';

export interface DistrictDefinition {
  id: DistrictId;
  name: string; // UPPERCASE for tag heading
  displayName: string;
  zone: 'S' | 'C';
  tagPosition: { x: number; y: number }; // Percent coordinates (0-100)
  unlockHint: string;
}

export const DISTRICT_DEFINITIONS: Record<DistrictId, DistrictDefinition> = {
  slums: {
    id: 'slums',
    name: 'THE SLUMS',
    displayName: 'The Slums',
    zone: 'S',
    tagPosition: { x: 27, y: 36 },
    unlockHint: '',
  },
  commercial: {
    id: 'commercial',
    name: 'COMMERCIAL STRIP',
    displayName: 'Commercial Strip',
    zone: 'C',
    tagPosition: { x: 72, y: 36 },
    unlockHint: 'Complete Chapter 3 for river bridge clearance.',
  },
};
