import type { NextRequest } from 'next/server';
import { getState, upsertTeam, markWaveSubmitted, clearTeam, mergeBadges } from '@/lib/launch-store';
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
  // badgesOnly: merge badges without overwriting existing scores
  if (body.badgesOnly) {
    return Response.json(await mergeBadges(body.wave, body.team.color as TeamColor, body.team.badges));
  }
  return Response.json(await upsertTeam(body.wave, body.team));
}
