/** Full name for each badge number. Used on the results leaderboard. */
export const BADGE_NAMES: Record<string, string> = {
  '111': 'Micah Adler',
  '122': 'Dan Ash',
  '133': 'David Beisel',
  '144': 'Sampriti Bhattacharyya',
  '155': 'Nickhil Bhave',
  '116': 'Anita Broellochs',
  '127': 'Thomas Cesare-Herriau',
  '138': 'Sahil Choudhry',
  '149': "Andrew D'Souza",
  '211': 'Anand Das',
  '222': 'Bryce DeFigueiredo',
  '233': 'Tim Eby',
  '244': 'Jeremy Fischer',
  '255': 'Carlos Gaitan Ospina',
  '216': 'Maxime Germain',
  '227': 'Fynn Glover',
  '238': 'Rob Go',
  '249': 'Amar Goel',
  '311': 'Adrien Guilmineau',
  '322': 'Derek Haswell',
  '333': 'Caleb Hicks',
  '344': 'Lee Hower',
  '355': 'Patrick Ip',
  '316': 'Katie Jaxheimer Agarwal',
  '327': 'John Joe Smith',
  '338': 'Mark Josephson',
  '349': 'Greg Karlin',
  '450': 'Melody Koh',
  '411': 'Kwasi Kyei',
  '422': 'Jawad Laraqui',
  '433': 'Mike Lewis',
  '444': 'Tiago Luchini',
  '455': 'Marco McCottry',
  '416': 'Alistair McLeay',
  '427': 'Alex McNaughten',
  '438': 'Jason Morrow',
  '550': 'Jackson Nicolas',
  '511': 'Stephanie Palmeri',
  '522': 'Peter Pezaris',
  '533': 'Zsika Phillip',
  '544': 'Carter Powers',
  '555': 'Semira Rahemtulla',
  '516': 'David Reich',
  '527': 'Kevin Rice',
  '538': 'Jerry Shu',
  '611': 'Augie Smith',
  '622': 'Xan Tanner',
  '633': 'Chris Taylor',
  '644': 'Amanda Tommasino',
  '655': 'Matthew Vega-Sanz',
  '616': 'Jean-Sébastien Wallez',
  '627': 'Robyn Ward',
  '638': 'Jonathan White',
  '649': 'Justin Whitehead',
};

export const VALID_BADGE_SET = new Set([
  '111', '116', '122', '127', '133', '138', '144', '149', '155',
  '211', '216', '222', '227', '233', '238', '244', '249', '255',
  '311', '316', '322', '327', '333', '338', '344', '349', '355',
  '411', '416', '422', '427', '433', '438', '444', '450', '455',
  '511', '516', '522', '527', '533', '538', '544', '550', '555',
  '611', '616', '622', '627', '633', '638', '644', '649', '655',
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
// 1=Red  2=Orange  3=Green  4=Blue  5=Purple
const LAUNCH_TEAM_DIGIT: Record<'Red' | 'Orange' | 'Green' | 'Blue' | 'Purple', string> = {
  Red: '1', Orange: '2', Green: '3', Blue: '4', Purple: '5',
};

/**
 * Returns the scheduled badges for a Launch team in a given wave.
 * Rule: second digit matches the team colour digit above.
 * These are defaults — the host adjusts day-of if people no-show or switch.
 */
export function launchDefaultBadges(
  wave: 1 | 2 | 3,
  color: 'Red' | 'Orange' | 'Green' | 'Blue' | 'Purple',
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
