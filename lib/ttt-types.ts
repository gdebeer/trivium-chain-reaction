export interface TTTWave {
  wave: 1 | 2 | 3;
  xBadges: string[];
  oBadges: string[];
  xScore: number;
  oScore: number;
  submittedAt?: string;
}

export interface TTTState {
  waves: TTTWave[];
}
