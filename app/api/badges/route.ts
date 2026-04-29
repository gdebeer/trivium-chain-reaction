import { getState as getPGRState } from '@/lib/pgr-store';
import { getState as getTTTState } from '@/lib/ttt-store';
import { getState as getLaunchState } from '@/lib/launch-store';

export interface UsedBadges {
  pgr: string[];
  ttt: string[];
  launch: string[];
}

export async function GET() {
  const [pgr, ttt, launch] = await Promise.all([
    getPGRState(),
    getTTTState(),
    getLaunchState(),
  ]);

  return Response.json({
    pgr: pgr.entries.flatMap(e => e.badges),
    ttt: ttt.waves.flatMap(w => [...w.xBadges, ...w.oBadges]),
    launch: launch.waves.flatMap(w =>
      Object.values(w.teams).flatMap(t => t?.badges ?? [])
    ),
  } satisfies UsedBadges);
}
