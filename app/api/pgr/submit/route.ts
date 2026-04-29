import type { NextRequest } from 'next/server';
import { getState, markWaveSubmitted } from '@/lib/pgr-store';

export async function POST(request: NextRequest) {
  const { wave } = (await request.json()) as { wave: 1 | 2 | 3 };

  const state = await getState();
  const entries = state.entries.filter(e => e.wave === wave);

  if (entries.length === 0) {
    return Response.json({ error: `No teams entered for Wave ${wave}` }, { status: 400 });
  }

  try {
    const updated = await markWaveSubmitted(wave);
    return Response.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
