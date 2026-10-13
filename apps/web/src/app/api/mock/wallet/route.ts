import { NextResponse } from 'next/server';
import { mockWallet } from '../db';

// MOCK: replace with Supabase edge function.
export async function GET() {
  return NextResponse.json({
    credits: mockWallet.credits,
    coins: mockWallet.coins,
    inventory: mockWallet.inventory,
    equippedTools: mockWallet.equippedTools,
  });
}
