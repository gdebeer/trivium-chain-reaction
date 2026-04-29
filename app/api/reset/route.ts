import { resetState as resetPGR } from '@/lib/pgr-store';
import { resetState as resetTTT } from '@/lib/ttt-store';
import { resetState as resetLaunch } from '@/lib/launch-store';

export async function POST() {
  await Promise.all([resetPGR(), resetTTT(), resetLaunch()]);
  return Response.json({ ok: true });
}
