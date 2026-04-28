import type { NextRequest } from 'next/server';
import { getState, updateSettings } from '@/lib/pgr-store';

export async function GET() {
  const state = await getState();
  return Response.json(state.settings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const state = await updateSettings(body);
  return Response.json(state.settings);
}
