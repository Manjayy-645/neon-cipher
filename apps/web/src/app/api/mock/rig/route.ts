import { NextResponse } from 'next/server';
import { mockRigHardware, mockWallet } from '../db';

// MOCK: replace with Supabase edge function.
export async function GET() {
  return NextResponse.json({
    hardware: mockRigHardware,
    equippedRails: mockWallet.equippedRails || {
      memory_1: null,
      memory_2: null,
      coprocessor: null,
      bus_interconnect: null,
    },
    equippedTools: mockWallet.equippedTools,
    inventory: mockWallet.inventory,
  });
}
