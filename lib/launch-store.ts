import type { LaunchState, LaunchTeam, TeamColor } from './launch-types';

const DEFAULT_STATE: LaunchState = { waves: [] };

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

export async function upsertTeam(waveNum: 1 | 2 | 3, team: LaunchTeam): Promise<LaunchState> {
  const state = await getState();
  const existing = state.waves.find(w => w.wave === waveNum);
  const updatedWave = existing
    ? { ...existing, teams: { ...existing.teams, [team.color]: team } }
    : { wave: waveNum, teams: { [team.color]: team } };
  const waves = existing
    ? state.waves.map(w => w.wave === waveNum ? updatedWave : w)
    : [...state.waves, updatedWave];
  return saveState({ waves });
}

export async function markWaveSubmitted(waveNum: 1 | 2 | 3): Promise<LaunchState> {
  const state = await getState();
  return saveState({
    waves: state.waves.map(w =>
      w.wave === waveNum ? { ...w, submittedAt: new Date().toISOString() } : w
    ),
  });
}

export async function clearTeam(waveNum: 1 | 2 | 3, color: TeamColor): Promise<LaunchState> {
  const state = await getState();
  return saveState({
    waves: state.waves.map(w => {
      if (w.wave !== waveNum) return w;
      const teams = { ...w.teams };
      delete teams[color];
      return { ...w, teams };
    }),
  });
}
