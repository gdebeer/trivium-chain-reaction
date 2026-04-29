import { randomUUID } from 'crypto';
import type { LaunchState, LaunchEntry } from './launch-types';

const DEFAULT_STATE: LaunchState = { entries: [] };

let mem: LaunchState = JSON.parse(JSON.stringify(DEFAULT_STATE));

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  if (!url || !token) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis');
  return new Redis({ url, token }) as import('@upstash/redis').Redis;
}

const KEY = 'launch:state';

export async function getState(): Promise<LaunchState> {
  const r = redis();
  if (r) {
    const stored = await r.get<LaunchState>(KEY);
    return stored ?? JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  return mem;
}

async function saveState(state: LaunchState): Promise<LaunchState> {
  const r = redis();
  if (r) { await r.set(KEY, state); } else { mem = state; }
  return state;
}

export async function addEntry(entry: Omit<LaunchEntry, 'id'>): Promise<LaunchState> {
  const state = await getState();
  return saveState({ entries: [...state.entries, { ...entry, id: randomUUID() }] });
}

export async function updateEntry(id: string, updates: Partial<Omit<LaunchEntry, 'id'>>): Promise<LaunchState> {
  const state = await getState();
  return saveState({ entries: state.entries.map(e => e.id === id ? { ...e, ...updates } : e) });
}

export async function deleteEntry(id: string): Promise<LaunchState> {
  const state = await getState();
  return saveState({ entries: state.entries.filter(e => e.id !== id) });
}

export async function markWaveSubmitted(wave: 1 | 2 | 3): Promise<LaunchState> {
  const state = await getState();
  const submittedAt = new Date().toISOString();
  return saveState({ entries: state.entries.map(e => e.wave === wave ? { ...e, submittedAt } : e) });
}
