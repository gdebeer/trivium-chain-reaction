export const TEAM_COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'] as const;
export type TeamColor = typeof TEAM_COLORS[number];

export interface LaunchTeam {
  color: TeamColor;
  badges: string[];
  round1Feet?: number;
  round2Total?: number;
}

export interface LaunchWave {
  wave: 1 | 2 | 3;
  teams: Partial<Record<TeamColor, LaunchTeam>>;
  submittedAt?: string;
}

export interface LaunchState {
  waves: LaunchWave[];
}

export function launchTeamTotal(team: LaunchTeam): number | null {
  if (team.round1Feet === undefined || team.round2Total === undefined) return null;
  return team.round1Feet * 5 + team.round2Total;
}

export const TEAM_COLORS_STYLE: Record<TeamColor, { bg: string; border: string; text: string; dot: string; ring: string; activeBorder: string }> = {
  Red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500',    ring: 'ring-red-400',    activeBorder: 'focus:border-red-400'    },
  Orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500', ring: 'ring-orange-400', activeBorder: 'focus:border-orange-400' },
  Yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500', ring: 'ring-yellow-400', activeBorder: 'focus:border-yellow-400' },
  Green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500',  ring: 'ring-green-400',  activeBorder: 'focus:border-green-400'  },
  Blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500',   ring: 'ring-blue-400',   activeBorder: 'focus:border-blue-400'   },
  Purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500', ring: 'ring-purple-400', activeBorder: 'focus:border-purple-400' },
};
