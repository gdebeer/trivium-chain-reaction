import type { NextRequest } from 'next/server';
import { getState, upsertTeam, markWaveSubmitted, clearTeam } from '@/lib/launch-store';
import type { TeamColor } from '@/lib/launch-types';

export async function GET() {
  return Response.json(await getState());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (body.action === 'SUBMIT_WAVE') {
    return Response.json(await markWaveSubmitted(body.wave));
  }
  if (body.action === 'CLEAR_TEAM') {
    return Response.json(await clearTeam(body.wave, body.color as TeamColor));
  }
  return Response.json(await upsertTeam(body.wave, body.team));
}
