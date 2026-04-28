import type { NextRequest } from 'next/server';
import { getState, markWaveSubmitted } from '@/lib/pgr-store';
import { appendEntriesToSheet } from '@/lib/pgr-sheets';

export async function POST(request: NextRequest) {
  const { wave } = (await request.json()) as { wave: 1 | 2 | 3 };

  const state = await getState();
  const entries = state.entries.filter(e => e.wave === wave);

  if (entries.length === 0) {
    return Response.json({ error: `No teams entered for Wave ${wave}` }, { status: 400 });
  }

  const { sheetId } = state.settings;
  if (!sheetId) {
    return Response.json(
      { error: 'Sheet ID not configured — tap ⚙ to add it in Settings' },
      { status: 400 }
    );
  }

  try {
    await appendEntriesToSheet(sheetId, entries);
    const updated = await markWaveSubmitted(wave);
    return Response.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
