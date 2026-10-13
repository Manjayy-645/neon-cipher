// MOCK: replace with Supabase.
import { NextResponse } from 'next/server';
import { exportAccountData } from '../../db';

export async function GET() {
  try {
    const data = exportAccountData();
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="neon-cipher-backup-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to export account data' }, { status: 400 });
  }
}
