import { getState as getPGRState } from '@/lib/pgr-store';
import { getState as getLaunchState } from '@/lib/launch-store';
import { getState as getTTTState } from '@/lib/ttt-store';
import { launchTeamTotal } from '@/lib/launch-types';

export interface BadgeResult {
  badge: string;
  pgrRaw: number | null;
  pgrNorm: number | null;
  tttRaw: number | null;
  tttNorm: number | null;
  launchRaw: number | null;
  launchNorm: number | null;
  total: number;
  pgrOrder: number | null;
}

export interface ResultsPayload {
  results: BadgeResult[];
  meta: {
    tttMax: number | null;
    launchMax: number | null;
    pgrMax: number | null;
    lastUpdated: string;
  };
}

export async function GET(): Promise<Response> {
  const [pgr, ttt, launch] = await Promise.all([getPGRState(), getTTTState(), getLaunchState()]);

  // ── Build badge → score maps ───────────────────────────────────────────────

  // PGR: sum the 4 sub-scores per badge (badge can appear in multiple teams
  // only if data entry error; take the first match)
  const pgrMap = new Map<string, { raw: number; order: number }>();
  for (const entry of pgr.entries) {
    const raw = entry.egypt + entry.caribbean + entry.hollywood + entry.australia;
    for (const badge of entry.badges) {
      if (!pgrMap.has(badge)) pgrMap.set(badge, { raw, order: entry.order });
    }
  }

  // TTT: each badge gets their team's score
  const tttMap = new Map<string, number>();
  for (const wave of ttt.waves) {
    for (const b of wave.xBadges) if (!tttMap.has(b)) tttMap.set(b, wave.xScore);
    for (const b of wave.oBadges) if (!tttMap.has(b)) tttMap.set(b, wave.oScore);
  }

  // Launch: each badge gets their team's total score (only if both rounds scored)
  const launchMap = new Map<string, number>();
  for (const wave of launch.waves) {
    for (const team of Object.values(wave.teams)) {
      if (!team) continue;
      const total = launchTeamTotal(team);
      if (total === null) continue;
      for (const badge of team.badges) {
        if (!launchMap.has(badge)) launchMap.set(badge, total);
      }
    }
  }

  // ── Normalization denominators ─────────────────────────────────────────────
  const pgrMax  = pgrMap.size  > 0 ? Math.max(...Array.from(pgrMap.values()).map(v => v.raw)) : null;
  const tttMax  = tttMap.size  > 0 ? Math.max(...tttMap.values())    : null;
  const launchMax = launchMap.size > 0 ? Math.max(...launchMap.values()) : null;

  // ── Combine all known badges ───────────────────────────────────────────────
  const allBadges = new Set([...pgrMap.keys(), ...tttMap.keys(), ...launchMap.keys()]);

  const results: BadgeResult[] = Array.from(allBadges).map(badge => {
    const pgr = pgrMap.get(badge) ?? null;
    const tttRaw = tttMap.get(badge) ?? null;
    const launchRaw = launchMap.get(badge) ?? null;

    const pgrRaw = pgr?.raw ?? null;
    const pgrNorm = pgrRaw !== null && pgrMax ? (pgrRaw / pgrMax) * 100 : null;
    const tttNorm = tttRaw !== null && tttMax ? (tttRaw / tttMax) * 100 : null;
    const launchNorm = launchRaw !== null && launchMax ? (launchRaw / launchMax) * 100 : null;

    const total = (pgrNorm ?? 0) + (tttNorm ?? 0) + (launchNorm ?? 0);

    return {
      badge,
      pgrRaw,
      pgrNorm,
      tttRaw,
      tttNorm,
      launchRaw,
      launchNorm,
      total,
      pgrOrder: pgr?.order ?? null,
    };
  });

  // Sort: total descending, then pgrOrder ascending as tiebreaker
  results.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (a.pgrOrder !== null && b.pgrOrder !== null) return a.pgrOrder - b.pgrOrder;
    if (a.pgrOrder !== null) return -1;
    if (b.pgrOrder !== null) return 1;
    return 0;
  });

  return Response.json({
    results,
    meta: { tttMax, launchMax, pgrMax, lastUpdated: new Date().toISOString() },
  } satisfies ResultsPayload);
}
