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
