export interface Round {
  id: string;
  name: string;
  words: string[];
}

export interface GameState {
  status: 'waiting' | 'active';
  currentWord: string | null;
  rounds: Round[];
  scoreVisible?: boolean;
  displayXScore?: number;
  displayOScore?: number;
}

export type GameAction =
  | { type: 'SHOW_WORD'; word: string }
  | { type: 'SHOW_WAITING' }
  | { type: 'SAVE_ROUND'; round: Partial<Round> & { name: string; words: string[] } }
  | { type: 'DELETE_ROUND'; id: string }
  | { type: 'REORDER_ROUNDS'; ids: string[] }
  | { type: 'SET_SCORE_VISIBILITY'; visible: boolean; xScore: number; oScore: number };
