import { NextRequest, NextResponse } from 'next/server';
import { getState, applyAction } from '@/lib/store';
import type { GameAction } from '@/lib/types';

export async function GET() {
  const state = await getState();
  return NextResponse.json(state, {
    headers: { 'Cache-Control': 's-maxage=1, stale-while-revalidate=1' },
  });
}

export async function POST(request: NextRequest) {
  const action = (await request.json()) as GameAction;
  const state = await applyAction(action);
  return NextResponse.json(state);
}
