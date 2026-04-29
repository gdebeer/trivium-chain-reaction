'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { LaunchState, LaunchTeam, TeamColor } from '@/lib/launch-types';
import { TEAM_COLORS, TEAM_COLORS_STYLE, launchTeamTotal } from '@/lib/launch-types';
import { getBadgeStatus, BADGE_INPUT_CLASS, badgeWarnings, badgeWaveWarnings, launchDefaultBadges } from '@/lib/badge-list';
import type { UsedBadges } from '@/app/api/badges/route';

async function api<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

// ─── Badge entry modal ────────────────────────────────────────────────────────

function BadgeModal({
  wave,
  color,
  initial,
  onSave,
  onCancel,
}: {
  wave: 1 | 2 | 3;
  color: TeamColor;
  initial: string[];
  onSave: (s: LaunchState) => void;
  onCancel: () => void;
}) {
  const style = TEAM_COLORS_STYLE[color];
  // Pre-fill from schedule if no badges confirmed yet; host adjusts for no-shows day-of
  const seed = initial.length > 0 ? initial : launchDefaultBadges(wave, color);
  const [badges, setBadges] = useState<string[]>([...seed, '', '', '', ''].slice(0, 4));
  const [saving, setSaving] = useState(false);
  const [usedInStation, setUsedInStation] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/badges')
      .then(r => r.json())
      .then((d: UsedBadges) => {
        const own = new Set(initial);
        setUsedInStation(new Set(d.launch.filter(b => !own.has(b))));
      });
  }, [initial]);

  function setBadge(i: number, val: string) {
    const next = [...badges]; next[i] = val; setBadges(next);
  }

  const badgeStatuses = badges.map(b => getBadgeStatus(b, badges, usedInStation));
  const warnings = [
    ...badgeWarnings(badges, badgeStatuses),
    ...badgeWaveWarnings(badges, wave, 'launch'),
  ];

  async function handleSave() {
    const valid = badges.map(b => b.trim()).filter(Boolean);
    setSaving(true);
    // Save whatever team data already exists, just updating badges
    const state = await api<LaunchState>('/api/launch/entries', 'POST', {
      wave,
      team: { color, badges: valid, round1Feet: undefined, round2Total: undefined },
      badgesOnly: true,
    });
    onSave(state);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={onCancel}>
      <div className="w-full bg-white rounded-t-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3.5 h-3.5 rounded-full ${style.dot}`} />
            <h2 className="text-lg font-bold text-gray-900">{color} Team Badges</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {badges.map((b, i) => (
            <input
              key={i}
              type="text"
              inputMode="numeric"
              value={b}
              onChange={e => setBadge(i, e.target.value)}
              placeholder={i < 2 ? `Badge ${i + 1}` : `Badge ${i + 1} (optional)`}
              className={`border rounded-xl px-3 py-3 text-base font-mono focus:outline-none focus:ring-2 ${style.ring} ${
                i >= 2 && badgeStatuses[i] === 'empty'
                  ? 'border-dashed border-gray-300 text-gray-500'
                  : BADGE_INPUT_CLASS[badgeStatuses[i]]
              }`}
            />
          ))}
        </div>
        {warnings.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {warnings.map(w => (
              <li key={w} className="text-xs text-amber-700 flex items-start gap-1">
                <span>⚠</span><span>{w}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full ${style.dot} text-white font-semibold rounded-2xl py-3.5 text-base disabled:opacity-50 active:opacity-80`}
        >
          {saving ? 'Saving…' : 'Save Badges'}
        </button>
      </div>
    </div>
  );
}

// ─── Team row with inline score inputs ───────────────────────────────────────

function TeamRow({
  wave,
  color,
  team,
  onUpdate,
  onBadgeTap,
}: {
  wave: 1 | 2 | 3;
  color: TeamColor;
  team?: LaunchTeam;
  onUpdate: (updated: LaunchState) => void;
  onBadgeTap: () => void;
}) {
  const style = TEAM_COLORS_STYLE[color];
  const [feet, setFeet] = useState(team?.round1Feet?.toString() ?? '');
  const [r2, setR2] = useState(team?.round2Total?.toString() ?? '');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external state changes (e.g. wave switch resets)
  const prevWave = useRef(wave);
  useEffect(() => {
    if (prevWave.current !== wave) {
      setFeet(team?.round1Feet?.toString() ?? '');
      setR2(team?.round2Total?.toString() ?? '');
      prevWave.current = wave;
    }
  }, [wave, team]);

  async function save(nextFeet: string, nextR2: string) {
    const hasAny = nextFeet.trim() || nextR2.trim();
    if (!hasAny) return;
    const teamData: LaunchTeam = {
      color,
      badges: team?.badges ?? [],
      ...(nextFeet.trim() ? { round1Feet: Number(nextFeet) } : {}),
      ...(nextR2.trim() ? { round2Total: Number(nextR2) } : {}),
    };
    try {
      const updated = await api<LaunchState>('/api/launch/entries', 'POST', { wave, team: teamData });
      onUpdate(updated);
    } catch { /* silent — will retry on next blur */ }
  }

  function scheduleSave(nextFeet: string, nextR2: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(nextFeet, nextR2), 600);
  }

  const r1Pts = feet.trim() !== '' ? Number(feet) * 5 : null;
  const total = r1Pts !== null && r2 ? r1Pts + Number(r2) : null;
  const hasData = !!(feet || r2);

  return (
    <div className={`rounded-2xl border-2 px-3 py-3 transition-colors ${hasData ? `${style.bg} ${style.border}` : 'bg-white border-gray-200'}`}>
      {/* Top row: color + badges + total */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${style.dot}`} />
          <span className={`font-bold text-sm ${hasData ? style.text : 'text-gray-500'}`}>{color}</span>
          <button
            onClick={onBadgeTap}
            className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
              team?.badges.length
                ? `${style.bg} ${style.text} border ${style.border}`
                : 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'
            }`}
          >
            {team?.badges.length
              ? `${team.badges.length} badges`
              : `${launchDefaultBadges(wave, color).length} expected`}
          </button>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          {total !== null ? (
            <span className={`text-xl font-black ${style.text}`}>{total}</span>
          ) : (
            <span className="text-sm text-gray-300 font-medium">—</span>
          )}
        </div>
      </div>

      {/* Score inputs */}
      <div className="flex gap-2 items-start">
        {/* Round 1 */}
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1 leading-none">R1 distance</p>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              value={feet}
              onChange={e => { setFeet(e.target.value); scheduleSave(e.target.value, r2); }}
              onBlur={() => save(feet, r2)}
              min="0"
              step="0.5"
              placeholder="0"
              className={`w-full border rounded-xl px-2.5 py-2 text-base font-mono text-center focus:outline-none focus:ring-2 ${style.ring} bg-white ${hasData ? style.border : 'border-gray-200'}`}
            />
            <span className="text-xs text-gray-400 flex-shrink-0">ft</span>
          </div>
          {r1Pts !== null && (
            <p className={`text-xs mt-1 text-right font-semibold ${style.text}`}>{r1Pts} pts</p>
          )}
        </div>

        {/* Round 2 */}
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1 leading-none">R2 target</p>
          <input
            type="number"
            inputMode="numeric"
            value={r2}
            onChange={e => { setR2(e.target.value); scheduleSave(feet, e.target.value); }}
            onBlur={() => save(feet, r2)}
            min="0"
            placeholder="0"
            className={`w-full border rounded-xl px-2.5 py-2 text-base font-mono text-center focus:outline-none focus:ring-2 ${style.ring} bg-white ${hasData ? style.border : 'border-gray-200'}`}
          />
          <p className="text-xs mt-1 text-right text-gray-400">pts</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LaunchPage() {
  const [state, setState] = useState<LaunchState | null>(null);
  const [wave, setWave] = useState<1 | 2 | 3>(1);
  const [badgeColor, setBadgeColor] = useState<TeamColor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

  const load = useCallback(async () => {
    setState(await api<LaunchState>('/api/launch/entries'));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400 text-2xl animate-pulse">Loading…</span>
      </div>
    );
  }

  const waveData = state.waves.find(w => w.wave === wave);
  const teams = waveData?.teams ?? {};
  const filledCount = Object.values(teams).filter(t => t && (t.round1Feet !== undefined || t.round2Total !== undefined)).length;
  const completeCount = Object.values(teams).filter(t => t && launchTeamTotal(t) !== null).length;
  const waveSubmitted = !!waveData?.submittedAt;

  async function handleSubmitWave() {
    if (completeCount === 0) { setSubmitError('No complete scores yet.'); return; }
    if (waveSubmitted && !confirm(`Wave ${wave} already saved. Save again?`)) return;
    setSubmitting(true); setSubmitError(''); setSubmitMsg('');
    try {
      setState(await api<LaunchState>('/api/launch/entries', 'POST', { action: 'SUBMIT_WAVE', wave }));
      setSubmitMsg(`Wave ${wave} scores saved!`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  const waveCount = (w: number) => {
    const wd = state.waves.find(wv => wv.wave === w);
    if (!wd) return 0;
    return Object.values(wd.teams).filter(t => t && launchTeamTotal(t) !== null).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <a href="/" className="text-xs text-gray-400 font-medium uppercase tracking-wider leading-none mb-0.5 block hover:text-orange-500 transition-colors">← Next View 2026</a>
          <h1 className="font-bold text-gray-900 text-lg leading-none">3-2-1 Launch</h1>
        </div>
        <a href="/results" className="text-xs text-orange-600 font-semibold px-3 py-1.5 rounded-lg border border-orange-200 active:bg-orange-50">
          Results ↗
        </a>
      </header>

      {/* Wave tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2 flex-shrink-0">
        {([1, 2, 3] as const).map(w => {
          const count = waveCount(w);
          return (
            <button
              key={w}
              onClick={() => { setWave(w); setSubmitMsg(''); setSubmitError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                wave === w ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              Wave {w}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${wave === w ? 'bg-white/25 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Score hint */}
      <div className="px-4 pt-3 pb-1 flex gap-4 text-xs text-gray-400">
        <span className="flex-1 text-center">R1 distance (ft)</span>
        <span className="flex-1 text-center">R2 target (pts)</span>
      </div>

      {/* Team rows */}
      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-36 space-y-2">
        {TEAM_COLORS.map(color => (
          <TeamRow
            key={color}
            wave={wave}
            color={color}
            team={teams[color]}
            onUpdate={setState}
            onBadgeTap={() => setBadgeColor(color)}
          />
        ))}
      </main>

      {/* Submit footer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white/95 backdrop-blur border-t border-gray-200 px-4 pt-3 pb-8">
        {submitMsg && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5 mb-2 text-center font-medium">{submitMsg}</p>}
        {submitError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-2 text-center">{submitError}</p>}
        <div className="flex justify-center">
          <button
            onClick={handleSubmitWave}
            disabled={submitting || completeCount === 0}
            className={`w-full max-w-sm rounded-2xl py-4 font-bold text-base transition-colors disabled:opacity-40 ${
              waveSubmitted ? 'bg-emerald-600 text-white active:bg-emerald-700' : 'bg-orange-500 text-white active:bg-orange-600'
            }`}
          >
            {submitting ? 'Submitting…' : waveSubmitted ? `Resubmit Wave ${wave}` : `Submit Wave ${wave} Scores`}
            {completeCount > 0 && !submitting && (
              <span className="ml-2 opacity-75 font-normal text-sm">({completeCount}/5)</span>
            )}
          </button>
        </div>
      </div>

      {badgeColor && (
        <BadgeModal
          wave={wave}
          color={badgeColor}
          initial={teams[badgeColor]?.badges ?? []}
          onSave={s => { setState(s); setBadgeColor(null); }}
          onCancel={() => setBadgeColor(null)}
        />
      )}
    </div>
  );
}
