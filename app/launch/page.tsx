'use client';

import { useEffect, useState, useCallback } from 'react';
import type { LaunchEntry, LaunchState } from '@/lib/launch-types';
import { launchTotal } from '@/lib/launch-types';

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

// ─── Entry form ───────────────────────────────────────────────────────────────

function EntryForm({
  wave,
  initial,
  onSave,
  onCancel,
}: {
  wave: 1 | 2 | 3;
  initial?: LaunchEntry;
  onSave: (s: LaunchState) => void;
  onCancel: () => void;
}) {
  const [badges, setBadges] = useState<string[]>(
    initial?.badges.length ? [...initial.badges, '', ''].slice(0, 4) : ['', '', '', '']
  );
  const [feet, setFeet] = useState(initial?.round1Feet?.toString() ?? '');
  const [round2, setRound2] = useState(initial?.round2Total?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setBadge(i: number, val: string) {
    const next = [...badges];
    next[i] = val;
    setBadges(next);
  }

  async function handleSave() {
    const validBadges = badges.map(b => b.trim()).filter(Boolean);
    if (validBadges.length < 2) { setError('Enter at least 2 badge numbers.'); return; }
    if (!feet) { setError('Enter Round 1 distance.'); return; }
    if (!round2) { setError('Enter Round 2 total score.'); return; }
    const entry = {
      wave,
      badges: validBadges,
      round1Feet: Number(feet),
      round2Total: Number(round2),
    };
    setSaving(true);
    setError('');
    try {
      const state = initial
        ? await api<LaunchState>('/api/launch/entries', 'PUT', { id: initial.id, ...entry })
        : await api<LaunchState>('/api/launch/entries', 'POST', entry);
      onSave(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  const round1Score = feet ? Number(feet) * 5 : null;
  const totalScore = round1Score !== null && round2 ? round1Score + Number(round2) : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={onCancel}>
      <div
        className="w-full bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {initial ? 'Edit Team' : 'Add Team'} — Wave {wave}
          </h2>
          <button onClick={onCancel} className="text-gray-400 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="px-5 pt-5 pb-10 space-y-6">
          {/* Badge numbers */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Badge Numbers (2–4 players)</p>
            <div className="grid grid-cols-2 gap-2">
              {badges.map((b, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  value={b}
                  onChange={e => setBadge(i, e.target.value)}
                  placeholder={i < 2 ? `Badge ${i + 1}` : `Badge ${i + 1} (optional)`}
                  className={`border rounded-xl px-3 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    i < 2 ? 'border-gray-300' : 'border-dashed border-gray-300 text-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Round 1 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Round 1 — Distance</p>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-medium text-gray-800">Distance (feet)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={feet}
                  onChange={e => setFeet(e.target.value)}
                  min="0"
                  step="0.1"
                  className="w-28 border border-gray-300 rounded-xl px-3 py-2 text-base text-right font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              {round1Score !== null && (
                <p className="text-sm text-gray-500 text-right">
                  = <span className="font-bold text-gray-700">{round1Score} pts</span> (× 5)
                </p>
              )}
            </div>
          </div>

          {/* Round 2 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Round 2 — Target Score</p>
            <div className="bg-gray-50 rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-medium text-gray-800">Total score</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={round2}
                  onChange={e => setRound2(e.target.value)}
                  min="0"
                  className="w-28 border border-gray-300 rounded-xl px-3 py-2 text-base text-right font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Outer: 5 · Middle: 10 · Inner: 20 · Bullseye: 100</p>
            </div>
          </div>

          {/* Total preview */}
          {totalScore !== null && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-orange-700">Total score</span>
              <span className="text-2xl font-black text-orange-600">{totalScore}</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-orange-500 text-white font-semibold rounded-2xl py-4 text-base active:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Team'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LaunchPage() {
  const [state, setState] = useState<LaunchState | null>(null);
  const [wave, setWave] = useState<1 | 2 | 3>(1);
  const [editing, setEditing] = useState<LaunchEntry | 'new' | null>(null);
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

  const waveEntries = state.entries.filter(e => e.wave === wave);
  const waveSubmitted = waveEntries.length > 0 && waveEntries.every(e => e.submittedAt);

  async function handleDelete(id: string) {
    if (!confirm('Remove this team?')) return;
    setState(await api<LaunchState>('/api/launch/entries', 'DELETE', { id }));
  }

  async function handleSubmitWave() {
    if (waveEntries.length === 0) { setSubmitError(`No teams in Wave ${wave}.`); return; }
    if (waveSubmitted && !confirm(`Wave ${wave} already submitted. Mark again?`)) return;
    setSubmitting(true);
    setSubmitError('');
    setSubmitMsg('');
    try {
      setState(await api<LaunchState>('/api/launch/entries', 'POST', { action: 'SUBMIT_WAVE', wave }));
      setSubmitMsg(`Wave ${wave} scores saved!`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  const waveCount = (w: number) => state.entries.filter(e => e.wave === w).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider leading-none mb-0.5">Next View 2026</p>
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
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  wave === w ? 'bg-white/25 text-white' : 'bg-gray-300 text-gray-600'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-36 space-y-3">
        {waveEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-5xl mb-3">🚀</p>
            <p className="text-gray-500 text-sm font-medium">No teams in Wave {wave} yet.</p>
            <p className="text-gray-400 text-xs mt-1">Tap Add Team to record scores.</p>
          </div>
        ) : (
          waveEntries.map(entry => {
            const total = launchTotal(entry);
            return (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {entry.badges.map(b => (
                      <span key={b} className="bg-orange-100 text-orange-700 text-sm font-bold px-2.5 py-1 rounded-lg font-mono">#{b}</span>
                    ))}
                    {entry.submittedAt && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 font-semibold px-2.5 py-1 rounded-lg">✓ Saved</span>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditing(entry)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 active:bg-gray-100">✏️</button>
                    <button onClick={() => handleDelete(entry.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 active:bg-red-50">🗑️</button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 rounded-xl py-2.5 px-3">
                    <p className="text-xs text-gray-400 mb-0.5">Round 1</p>
                    <p className="text-sm font-semibold text-gray-700">{entry.round1Feet} ft</p>
                    <p className="text-base font-bold text-gray-800">{entry.round1Feet * 5} pts</p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl py-2.5 px-3">
                    <p className="text-xs text-gray-400 mb-0.5">Round 2</p>
                    <p className="text-base font-bold text-gray-800">{entry.round2Total} pts</p>
                  </div>
                  <div className="flex-1 bg-orange-50 rounded-xl py-2.5 px-3 border border-orange-200">
                    <p className="text-xs text-orange-500 mb-0.5">Total</p>
                    <p className="text-xl font-black text-orange-600">{total}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <button
          onClick={() => setEditing('new')}
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-gray-500 font-semibold text-sm active:border-orange-400 active:text-orange-600 transition-colors"
        >
          + Add Team
        </button>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur border-t border-gray-200 px-4 pt-3 pb-8">
        {submitMsg && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5 mb-2 text-center font-medium">{submitMsg}</p>}
        {submitError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-2 text-center">{submitError}</p>}
        <button
          onClick={handleSubmitWave}
          disabled={submitting || waveEntries.length === 0}
          className={`w-full rounded-2xl py-4 font-bold text-base transition-colors disabled:opacity-40 ${
            waveSubmitted ? 'bg-emerald-600 text-white active:bg-emerald-700' : 'bg-orange-500 text-white active:bg-orange-600'
          }`}
        >
          {submitting ? 'Saving…' : waveSubmitted ? `Resave Wave ${wave}` : `Save Wave ${wave} Scores`}
        </button>
      </div>

      {editing !== null && (
        <EntryForm
          wave={wave}
          initial={editing !== 'new' ? editing : undefined}
          onSave={s => { setState(s); setEditing(null); }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
