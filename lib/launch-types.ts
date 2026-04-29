export interface LaunchEntry {
  id: string;
  wave: 1 | 2 | 3;
  badges: string[];
  round1Feet: number;
  round2Total: number;
  submittedAt?: string;
}

export interface LaunchState {
  entries: LaunchEntry[];
}

export function launchTotal(entry: LaunchEntry): number {
  return entry.round1Feet * 5 + entry.round2Total;
}
