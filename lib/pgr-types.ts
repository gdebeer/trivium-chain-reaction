export interface PGREntry {
  id: string;
  wave: 1 | 2 | 3;
  badges: string[];
  egypt: number;
  caribbeans: number;
  hollywood: number;
  australia: number;
  order: number;
  submittedAt?: string;
}

export interface PGRSettings {
  sheetId: string;
}

export interface PGRState {
  entries: PGREntry[];
  settings: PGRSettings;
}
