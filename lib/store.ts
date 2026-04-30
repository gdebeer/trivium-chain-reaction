import { randomUUID } from 'crypto';
import type { GameState, GameAction } from './types';

const DEFAULT_STATE: GameState = {
  status: 'waiting',
  currentWord: null,
  rounds: [],
};

// In-memory fallback — works in local dev, resets on server restart
let mem: GameState = { ...DEFAULT_STATE };

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  if (!url || !token) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis');
  return new Redis({ url, token }) as import('@upstash/redis').Redis;
}

const KEY = 'chain-reaction:state';

export async function getState(): Promise<GameState> {
  const r = redis();
  if (r) {
    const stored = await r.get<GameState>(KEY);
    return stored ?? DEFAULT_STATE;
  }
  return mem;
}

/** Resets display state (status → waiting, currentWord → null) while keeping rounds intact. */
export async function resetDisplayState(): Promise<void> {
  const state = await getState();
  const next: GameState = { ...state, status: 'waiting', currentWord: null };
  const r = redis();
  if (r) { await r.set(KEY, next); } else { mem = next; }
}

export async function applyAction(action: GameAction): Promise<GameState> {
  const state = await getState();
  let next: GameState;

  switch (action.type) {
    case 'SHOW_WORD':
      next = { ...state, status: 'active', currentWord: action.word };
      break;
    case 'SHOW_WAITING':
      next = { ...state, status: 'waiting', currentWord: null };
      break;
    case 'SAVE_ROUND': {
      const { id, name, words } = action.round;
      if (id) {
        next = { ...state, rounds: state.rounds.map(r => r.id === id ? { id, name, words } : r) };
      } else {
        next = { ...state, rounds: [...state.rounds, { id: randomUUID(), name, words }] };
      }
      break;
    }
    case 'DELETE_ROUND':
      next = { ...state, rounds: state.rounds.filter(r => r.id !== action.id) };
      break;
    case 'REORDER_ROUNDS': {
      const lookup = new Map(state.rounds.map(r => [r.id, r]));
      const reordered = action.ids.map(id => lookup.get(id)).filter(Boolean) as typeof state.rounds;
      next = { ...state, rounds: reordered };
      break;
    }
    case 'SET_SCORE_VISIBILITY':
      next = { ...state, scoreVisible: action.visible, displayXScore: action.xScore, displayOScore: action.oScore };
      break;
    default:
      next = state;
  }

  const r = redis();
  if (r) {
    await r.set(KEY, next);
  } else {
    mem = next;
  }
  return next;
}
