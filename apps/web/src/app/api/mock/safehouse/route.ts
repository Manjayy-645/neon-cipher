import { NextResponse } from 'next/server';
import { mockSafehouses } from '../db';

// MOCK: replace with Supabase edge function.
export async function GET() {
  const properties = Object.values(mockSafehouses);

  const ownedProps = properties.filter((p) => p.owned);
  const totalUpkeep = ownedProps.reduce((sum, p) => sum + p.upkeep, 0);
  const totalDailyDividend = ownedProps.reduce((sum, p) => sum + p.dailyDividend, 0);
  const totalTraceReduction = Math.min(
    75,
    ownedProps.reduce((sum, p) => sum + p.traceReductionPercent, 0)
  );

  return NextResponse.json({
    properties,
    stats: {
      ownedCount: ownedProps.length,
      totalUpkeep,
      totalDailyDividend,
      totalTraceReduction,
    },
  });
}
