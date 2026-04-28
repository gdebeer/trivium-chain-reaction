export interface Round {
  id: string;
  name: string;
  words: string[];
}

export interface GameState {
  status: 'waiting' | 'active';
  currentWord: string | null;
  rounds: Round[];
}

export type GameAction =
  | { type: 'SHOW_WORD'; word: string }
  | { type: 'SHOW_WAITING' }
  | { type: 'SAVE_ROUND'; round: Partial<Round> & { name: string; words: string[] } }
  | { type: 'DELETE_ROUND'; id: string };
