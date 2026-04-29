import type { NextRequest } from 'next/server';
import { getState, upsertWave, submitWave } from '@/lib/ttt-store';

export async function GET() {
  return Response.json(await getState());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (body.action === 'SUBMIT_WAVE') {
    return Response.json(await submitWave(body.wave));
  }
  return Response.json(await upsertWave(body));
}
