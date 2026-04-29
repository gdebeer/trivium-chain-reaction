export const VALID_BADGE_SET = new Set([
  '111', '211', '311', '450', '550', '611',
  '122', '222', '322', '411', '511', '622',
  '133', '233', '333', '422', '522', '633',
  '144', '244', '344', '433', '533', '644',
  '155', '255', '355', '444', '544', '655',
  '116', '216', '316', '455', '555', '616',
  '127', '227', '327', '416', '516', '627',
  '138', '238', '338', '427', '527', '638',
  '149', '249', '349', '438', '538', '649',
  '150',
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

// ─── Station routing ──────────────────────────────────────────────────────────
// First digit of badge → which wave (1/2/3) that badge attends at each station.
// Schedule: 1=PGR→TTT→Launch  2=Launch→PGR→TTT  3=TTT→Launch→PGR
//           4=PGR→Launch→TTT  5=Launch→TTT→PGR  6=TTT→PGR→Launch

const STATION_WAVE_FOR_DIGIT: Record<string, Record<'pgr' | 'ttt' | 'launch', 1 | 2 | 3>> = {
  '1': { pgr: 1, ttt: 2, launch: 3 },
  '2': { pgr: 2, ttt: 3, launch: 1 },
  '3': { pgr: 3, ttt: 1, launch: 2 },
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
 * X = odd last digit, O = even last digit.
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
