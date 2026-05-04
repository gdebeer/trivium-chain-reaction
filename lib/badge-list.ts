/** Full name for each badge number. Used on the results leaderboard. */
export const BADGE_NAMES: Record<string, string> = {
  '111': 'Micah Adler',
  '118': 'Dan Ash',
  '122': 'David Beisel',
  '127': 'Sampriti Bhattacharyya',
  '130': 'Nickhil Bhave',
  '139': 'Anita Broellochs',
  '144': 'Thomas Cesare-Herriau',
  '155': 'Sahil Choudhry',
  '166': "Andrew D'Souza",
  '211': 'Anand Das',
  '218': 'Bryce DeFigueiredo',
  '222': 'Tim Eby',
  '227': 'Jeremy Fischer',
  '230': 'Carlos Gaitan Ospina',
  '233': 'Maxime Germain',
  '241': 'Fynn Glover',
  '255': 'Rob Go',
  '266': 'Amar Goel',
  '311': 'Adrien Guilmineau',
  '318': 'Derek Haswell',
  '322': 'Caleb Hicks',
  '327': 'Lee Hower',
  '330': 'Patrick Ip',
  '333': 'Katie Jaxheimer Agarwal',
  '344': 'John Joe Smith',
  '355': 'Mark Josephson',
  '366': 'Greg Karlin',
  '413': 'Melody Koh',
  '424': 'Kwasi Kyei',
  '435': 'Jawad Laraqui',
  '440': 'Mike Lewis',
  '447': 'Tiago Luchini',
  '451': 'Marco McCottry',
  '456': 'Alistair McLeay',
  '462': 'Alex McNaughten',
  '465': 'Jason Morrow',
  '513': 'Jackson Nicolas',
  '524': 'Stephanie Palmeri',
  '535': 'Peter Pezaris',
  '540': 'Zsika Phillip',
  '547': 'Carter Powers',
  '551': 'Semira Rahemtulla',
  '556': 'David Reich',
  '561': 'Kevin Rice',
  '562': 'Jerry Shu',
  '614': 'Augie Smith',
  '625': 'Xan Tanner',
  '636': 'Chris Taylor',
  '641': 'Amanda Tommasino',

  '652': 'Jean-Sébastien Wallez',
  '657': 'Robyn Ward',
  '660': 'Jonathan White',
  '663': 'Justin Whitehead',
  // Backup badges — TTT only, excluded from Launch pre-population
  '113': 'Backup',
  '231': 'Backup',
  '351': 'Backup',
  '442': 'Backup',
  '560': 'Backup',
  '620': 'Backup',
};

export const VALID_BADGE_SET = new Set([
  '111', '118', '122', '127', '130', '139', '144', '155', '166',
  '211', '218', '222', '227', '230', '233', '241', '255', '266',
  '311', '318', '322', '327', '330', '333', '344', '355', '366',
  '413', '424', '435', '440', '447', '451', '456', '462', '465',
  '513', '524', '535', '540', '547', '551', '556', '561', '562',
  '614', '625', '636', '641', '652', '657', '660', '663',
  // Backup badges — pre-populate in TTT only
  '113', '231', '351', '442', '560', '620',
]);

// Excluded from Launch pre-population — TTT only
export const BACKUP_BADGES = new Set(['113', '231', '351', '442', '560', '620']);

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
    if (BACKUP_BADGES.has(badge)) continue;
    if (getExpectedWave(badge, 'launch') !== wave) continue;
    if (badge[1] !== teamDigit) continue;
    result.push(badge);
  }
  return result.sort();
}
