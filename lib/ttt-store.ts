import type { TTTState, TTTWave } from './ttt-types';

const DEFAULT_STATE: TTTState = { waves: [] };

let mem: TTTState = JSON.parse(JSON.stringify(DEFAULT_STATE));

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  if (!url || !token) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis');
  return new Redis({ url, token }) as import('@upstash/redis').Redis;
}

const KEY = 'ttt:state';

export async function getState(): Promise<TTTState> {
  const r = redis();
  if (r) {
    const stored = await r.get<TTTState>(KEY);
    return stored ?? JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  return mem;
}

async function saveState(state: TTTState): Promise<TTTState> {
  const r = redis();
  if (r) { await r.set(KEY, state); } else { mem = state; }
  return state;
}

export async function upsertWave(wave: TTTWave): Promise<TTTState> {
  const state = await getState();
  const exists = state.waves.some(w => w.wave === wave.wave);
  const waves = exists
    ? state.waves.map(w => w.wave === wave.wave ? wave : w)
    : [...state.waves, wave];
  return saveState({ waves });
}

export async function submitWave(waveNum: 1 | 2 | 3): Promise<TTTState> {
  const state = await getState();
  return saveState({
    waves: state.waves.map(w =>
      w.wave === waveNum ? { ...w, submittedAt: new Date().toISOString() } : w
    ),
  });
}
