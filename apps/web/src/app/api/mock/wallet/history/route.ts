import { NextResponse } from 'next/server';
import { mockTransactions } from '../../db';

// MOCK: replace with Supabase edge function.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currencyFilter = searchParams.get('currency');

  let list = [...mockTransactions];
  if (currencyFilter === 'credits' || currencyFilter === 'coins') {
    list = list.filter((tx) => tx.currency === currencyFilter);
  }

  return NextResponse.json({
    transactions: list,
    totalCount: list.length,
  });
}
