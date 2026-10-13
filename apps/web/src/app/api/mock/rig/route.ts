import { NextResponse } from 'next/server';
import { mockRigHardware, mockWallet } from '../db';

// MOCK: replace with Supabase edge function.
export async function GET() {
  return NextResponse.json({
    hardware: mockRigHardware,
    equippedTools: mockWallet.equippedTools,
    inventory: mockWallet.inventory,
  });
}
