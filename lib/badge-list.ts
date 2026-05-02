/** Full name for each badge number. Used on the results leaderboard. */
export const BADGE_NAMES: Record<string, string> = {
  '111': 'Micah Adler',
  '122': 'Dan Ash',
  '133': 'David Beisel',
  '144': 'Sampriti Bhattacharyya',
  '155': 'Nickhil Bhave',
  '166': 'Anita Broellochs',
  '117': 'Thomas Cesare-Herriau',
  '128': 'Sahil Choudhry',
  '139': "Andrew D'Souza",
  '211': 'Anand Das',
  '222': 'Bryce DeFigueiredo',
  '233': 'Tim Eby',
  '244': 'Jeremy Fischer',
  '255': 'Carlos Gaitan Ospina',
  '266': 'Maxime Germain',
  '217': 'Fynn Glover',
  '228': 'Rob Go',
  '239': 'Amar Goel',
  '311': 'Adrien Guilmineau',
  '322': 'Derek Haswell',
  '333': 'Caleb Hicks',
  '344': 'Lee Hower',
  '355': 'Patrick Ip',
  '366': 'Katie Jaxheimer Agarwal',
  '317': 'John Joe Smith',
  '328': 'Mark Josephson',
  '339': 'Greg Karlin',
  '440': 'Melody Koh',
  '451': 'Kwasi Kyei',
  '462': 'Jawad Laraqui',
  '413': 'Mike Lewis',
  '424': 'Tiago Luchini',
  '435': 'Marco McCottry',
  '446': 'Alistair McLeay',
  '457': 'Alex McNaughten',
  '468': 'Jason Morrow',
  '540': 'Jackson Nicolas',
  '551': 'Stephanie Palmeri',
  '562': 'Peter Pezaris',
  '513': 'Zsika Phillip',
  '524': 'Carter Powers',
  '535': 'Semira Rahemtulla',
  '546': 'David Reich',
  '557': 'Kevin Rice',
  '568': 'Jerry Shu',
  '641': 'Augie Smith',
  '652': 'Xan Tanner',
  '663': 'Chris Taylor',
  '614': 'Amanda Tommasino',
  '625': 'Matthew Vega-Sanz',
  '636': 'Jean-Sébastien Wallez',
  '647': 'Robyn Ward',
  '658': 'Jonathan White',
  '669': 'Justin Whitehead',
};

export const VALID_BADGE_SET = new Set([
  '111', '117', '122', '128', '133', '139', '144', '155', '166',
  '211', '217', '222', '228', '233', '239', '244', '255', '266',
  '311', '317', '322', '328', '333', '339', '344', '355', '366',
  '413', '424', '435', '440', '446', '451', '457', '462', '468',
  '513', '524', '535', '540', '546', '551', '557', '562', '568',
  '614', '625', '636', '641', '647', '652', '658', '663', '669',
]);

export type BadgeStatus = 'empty' | 'valid' | 'invalid' | 'duplicate';

/**
 * Validate a single badge entry.
 * @param badge        The badge string being validated.
 * @param allInForm    All badge strings currently in the same form (to catch local duplicates).
 * @param usedInStation  Badges already committed to this station in OTHER entries (excluding the one being edited).
 */
export function getBadgeStatus(
  badge: string,
  allInForm: string[],
  usedInStation: Set<string>,
): BadgeStatus {
  const b = badge.trim();
  if (!b) return 'empty';
  if (!VALID_BADGE_SET.has(b)) return 'invalid';
  if (allInForm.filter(x => x.trim() === b).length > 1) return 'duplicate';
  if (usedInStation.has(b)) return 'duplicate';
  return 'valid';
}

export const BADGE_INPUT_CLASS: Record<BadgeStatus, string> = {
  empty:     'border-gray-300',
  valid:     'border-green-400 bg-green-50',
  invalid:   'border-red-400 bg-red-50',
  duplicate: 'border-amber-400 bg-amber-50',
};

/** Human-readable warning lines for any non-valid, non-empty badges. */
export function badgeWarnings(badges: string[], statuses: BadgeStatus[]): string[] {
  const lines: string[] = [];
  badges.forEach((b, i) => {
    const s = statuses[i];
    if (!b.trim()) return;
    if (s === 'invalid')   lines.push(`${b} is not a valid badge number`);
    if (s === 'duplicate') lines.push(`${b} is already assigned at this station`);
  });
  return lines;
}

// ─── Badge digit rules ────────────────────────────────────────────────────────
//
// DIGIT 1 (first digit) → station visit order / wave assignment
//   Schedule: 1=PGR→TTT→Launch  2=TTT→Launch→PGR  3=Launch→PGR→TTT
//             4=PGR→Launch→TTT  5=Launch→TTT→PGR  6=TTT→PGR→Launch
//
// DIGIT 2 (middle digit) → initial Launch team assignment
//   1=Red  2=Orange  3=Green  4=Blue  5=Purple
//   (Most likely to change due to no-shows; defaults used until host adjusts)
//
// DIGIT 3 (last digit) → TTT team assignment
//   Odd = Team X,  Even = Team O
//
// To update badge numbers: replace VALID_BADGE_SET above.
// All rules derive automatically from the badge number — no other code changes needed.

const STATION_WAVE_FOR_DIGIT: Record<string, Record<'pgr' | 'ttt' | 'launch', 1 | 2 | 3>> = {
  '1': { pgr: 1, ttt: 2, launch: 3 },
  '2': { pgr: 3, ttt: 1, launch: 2 },
  '3': { pgr: 2, ttt: 3, launch: 1 },
  '4': { pgr: 1, ttt: 3, launch: 2 },
  '5': { pgr: 3, ttt: 2, launch: 1 },
  '6': { pgr: 2, ttt: 1, launch: 3 },
};

/** Returns the expected wave for a badge at a given station, or null if unknown. */
export function getExpectedWave(badge: string, station: 'pgr' | 'ttt' | 'launch'): 1 | 2 | 3 | null {
  const digit = badge.trim()[0];
  return STATION_WAVE_FOR_DIGIT[digit]?.[station] ?? null;
}

/**
 * Warning lines for badges that appear in the wrong wave at this station.
 * Warnings only — never blocks saving.
 */
export function badgeWaveWarnings(
  badges: string[],
  wave: 1 | 2 | 3,
  station: 'pgr' | 'ttt' | 'launch',
): string[] {
  const lines: string[] = [];
  for (const b of badges) {
    const trimmed = b.trim();
    if (!trimmed) continue;
    const expected = getExpectedWave(trimmed, station);
    if (expected !== null && expected !== wave) {
      lines.push(`${trimmed} is expected in Wave ${expected} at this station`);
    }
  }
  return lines;
}

// ─── TTT pre-computed teams ───────────────────────────────────────────────────

/**
 * Returns the pre-determined X and O teams for a TTT wave.
 * Rule: odd last digit → X, even last digit → O.
 * Based entirely on VALID_BADGE_SET + routing schedule — no manual entry needed.
 */
export function tttDefaultTeams(wave: 1 | 2 | 3): { x: string[]; o: string[] } {
  const x: string[] = [];
  const o: string[] = [];
  for (const badge of VALID_BADGE_SET) {
    if (getExpectedWave(badge, 'ttt') !== wave) continue;
    const last = parseInt(badge.at(-1) ?? '', 10);
    if (!isNaN(last) && last % 2 !== 0) x.push(badge);
    else o.push(badge);
  }
  return { x: x.sort(), o: o.sort() };
}

// ─── Launch pre-computed teams ────────────────────────────────────────────────

// Second digit → Launch team colour
// 1=Red  2=Orange  3=Yellow  4=Green  5=Blue  6=Purple
const LAUNCH_TEAM_DIGIT: Record<'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue' | 'Purple', string> = {
  Red: '1', Orange: '2', Yellow: '3', Green: '4', Blue: '5', Purple: '6',
};

/**
 * Returns the scheduled badges for a Launch team in a given wave.
 * Rule: second digit matches the team colour digit above.
 * These are defaults — the host adjusts day-of if people no-show or switch.
 */
export function launchDefaultBadges(
  wave: 1 | 2 | 3,
  color: 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue' | 'Purple',
): string[] {
  const teamDigit = LAUNCH_TEAM_DIGIT[color];
  const result: string[] = [];
  for (const badge of VALID_BADGE_SET) {
    if (getExpectedWave(badge, 'launch') !== wave) continue;
    if (badge[1] !== teamDigit) continue;
    result.push(badge);
  }
  return result.sort();
}
