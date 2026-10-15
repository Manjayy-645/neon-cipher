import { NextResponse } from 'next/server';
import { mockSafehouses, mockWallet } from '../db';

export const DISTRICT_LEASE_DEFINITIONS: Record<
  string,
  { name: string; district: string; dailyDividend: number; effect: string }
> = {
  'lease-slums-nodes': {
    name: 'Slums Public Node Lease',
    district: 'slums',
    dailyDividend: 250,
    effect: '+$250/day passive dividend from Slums sub-nodes',
  },
  'lease-docklands-pier': {
    name: 'Docklands Container Pier Lease',
    district: 'industrial',
    dailyDividend: 400,
    effect: '+$400/day passive dividend from automated freight relays',
  },
  'lease-corridor-transit': {
    name: 'Industrial Corridor Transit Lease',
    district: 'industrial',
    dailyDividend: 0,
    effect: '50% cooldown reduction on industrial sector nodes',
  },
  'lease-commercial-relay': {
    name: 'Commercial High-Bounty Relay Lease',
    district: 'commercial',
    dailyDividend: 0,
    effect: 'Access to encrypted Commercial sector syndication feeds',
  },
};

// MOCK: replace with Supabase edge function.
export async function GET() {
  const properties = Object.values(mockSafehouses);

  const ownedProps = properties.filter((p) => p.owned);
  const totalUpkeep = ownedProps.reduce((sum, p) => sum + p.upkeep, 0);
  let totalDailyDividend = ownedProps.reduce((sum, p) => sum + p.dailyDividend, 0);
  const totalTraceReduction = Math.min(
    75,
    ownedProps.reduce((sum, p) => sum + p.traceReductionPercent, 0)
  );

  const ownedLeases = Object.entries(DISTRICT_LEASE_DEFINITIONS)
    .filter(([id]) => (mockWallet.inventory[id] || 0) > 0)
    .map(([id, info]) => ({ id, ...info }));

  const totalLeaseDividends = ownedLeases.reduce((sum, l) => sum + l.dailyDividend, 0);
  totalDailyDividend += totalLeaseDividends;

  return NextResponse.json({
    properties,
    ownedLeases,
    stats: {
      ownedCount: ownedProps.length,
      ownedLeasesCount: ownedLeases.length,
      totalUpkeep,
      totalDailyDividend,
      totalTraceReduction,
    },
  });
}
