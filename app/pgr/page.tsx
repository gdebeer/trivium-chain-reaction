'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PGREntry, PGRState } from '@/lib/pgr-types';
import { getBadgeStatus, BADGE_INPUT_CLASS, badgeWarnings, badgeWaveWarnings } from '@/lib/badge-list';
import type { UsedBadges } from '@/app/api/badges/route';

// ─── API helper ───────────────────────────────────────────────────────────────

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
  initial?: PGREntry;
  onSave: (state: PGRState) => void;
  onCancel: () => void;
}) {
  const [b0, setB0] = useState(initial?.badges[0] ?? '');
  const [b1, setB1] = useState(initial?.badges[1] ?? '');
  const [b2, setB2] = useState(initial?.badges[2] ?? '');
  const [egypt, setEgypt] = useState(initial?.egypt?.toString() ?? '');
  const [caribbean, setCaribbean] = useState(initial?.caribbean?.toString() ?? '');
  const [hollywood, setHollywood] = useState(initial?.hollywood?.toString() ?? '');
  const [australia, setAustralia] = useState(initial?.australia?.toString() ?? '');
  const [order, setOrder] = useState(initial?.order?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [usedInStation, setUsedInStation] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/badges')
      .then(r => r.json())
      .then((d: UsedBadges) => {
        // Exclude this entry's own badges so they don't flag as duplicates
        const own = new Set(initial?.badges ?? []);
        setUsedInStation(new Set(d.pgr.filter(b => !own.has(b))));
      });
  }, [initial]);

  const formBadges = [b0, b1, b2];
  const badgeStatuses = formBadges.map(b => getBadgeStatus(b, formBadges, usedInStation));
  const warnings = [
    ...badgeWarnings(formBadges, badgeStatuses),
    ...badgeWaveWarnings(formBadges, wave, 'pgr'),
  ];

  // ─── Score field definitions with per-field validation ───────────────────
  const scoreFields: {
    label: string; val: string; setter: (v: string) => void;
    valid: (n: number) => boolean; hint: string;
  }[] = [
    { label: 'Egypt',      val: egypt,      setter: setEgypt,      valid: n => Number.isInteger(n) && n >= 0 && n <= 6, hint: '0–6' },
    { label: 'Caribbean',  val: caribbean,  setter: setCaribbean,  valid: n => n === 0 || n === 6,                      hint: '0 or 6' },
    { label: 'Hollywood',  val: hollywood,  setter: setHollywood,  valid: n => Number.isInteger(n) && n >= 0 && n <= 6, hint: '0–6' },
    { label: 'Australia',  val: australia,  setter: setAustralia,  valid: n => Number.isInteger(n) && n >= 0 && n <= 6, hint: '0–6' },
  ];
  const scoreWarnings = scoreFields
    .filter(f => f.val !== '' && !f.valid(Number(f.val)))
    .map(f => `${f.label}: must be ${f.hint}`);

  async function handleSave() {
    const badges = [b0, b1, b2].map(s => s.trim()).filter(Boolean);
    if (badges.length < 2) { setError('Enter at least 2 badge numbers.'); return; }
    if (!egypt || !caribbean || !hollywood || !australia || !order) {
      setError('All score and order fields are required.'); return;
    }
    const entry = {
      wave,
      badges,
      egypt: Number(egypt),
      caribbean: Number(caribbean),
      hollywood: Number(hollywood),
      australia: Number(australia),
      order: Number(order),
    };
    setSaving(true);
    setError('');
    try {
      const state = initial
        ? await api<PGRState>('/api/pgr/entries', 'PUT', { id: initial.id, ...entry })
        : await api<PGRState>('/api/pgr/entries', 'POST', entry);
      onSave(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={onCancel}>
      <div
        className="w-full bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto max-w-2xl mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {initial ? 'Edit Team' : 'Add Team'} — Wave {wave}
          </h2>
          <button onClick={onCancel} className="text-gray-400 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="px-5 pt-5 pb-10 space-y-6">
          {/* Badge numbers */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Badge Numbers</p>
            <div className="flex gap-2">
              {([
                [b0, setB0, 'Badge 1', false],
                [b1, setB1, 'Badge 2', false],
                [b2, setB2, 'Badge 3', true],
              ] as [string, (v: string) => void, string, boolean][]).map(([val, setter, placeholder, optional], i) => (
                <input
                  key={placeholder}
                  type="text"
                  inputMode="numeric"
                  value={val}
                  onChange={e => setter(e.target.value)}
                  placeholder={placeholder}
                  className={`flex-1 min-w-0 border rounded-xl px-3 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    optional && badgeStatuses[i] === 'empty'
                      ? 'border-dashed border-gray-300 text-gray-500'
                      : BADGE_INPUT_CLASS[badgeStatuses[i]]
                  }`}
                />
              ))}
            </div>
            {warnings.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {warnings.map(w => (
                  <li key={w} className="text-xs text-amber-700 flex items-start gap-1">
                    <span>⚠</span><span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-400 mt-1.5">Third badge is optional for 2-person teams.</p>
          </div>

          {/* Event scores */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Event Scores</p>
            <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
              {scoreFields.map(({ label, val, setter, valid, hint }) => {
                const isInvalid = val !== '' && !valid(Number(val));
                return (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <label className="text-base font-medium text-gray-800">{label}</label>
                      <p className="text-xs text-gray-400 leading-none mt-0.5">{hint}</p>
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={val}
                      onChange={e => setter(e.target.value)}
                      min="0"
                      max="6"
                      className={`w-24 border rounded-xl px-3 py-2 text-base text-right font-mono focus:outline-none focus:ring-2 ${
                        isInvalid
                          ? 'border-red-400 ring-red-300 bg-red-50 text-red-700 focus:ring-red-400'
                          : 'border-gray-300 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            {scoreWarnings.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {scoreWarnings.map(w => (
                  <li key={w} className="text-xs text-red-600 flex items-start gap-1">
                    <span>⚠</span><span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Finish order */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Finish Order</p>
            <input
              type="number"
              inputMode="numeric"
              value={order}
              onChange={e => setOrder(e.target.value)}
              placeholder="1 = first across the line"
              min="1"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1.5">Used as tiebreaker only. Lower is better.</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-600 text-white font-semibold rounded-2xl py-4 text-base active:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Team'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PGRPage() {
  const [state, setState] = useState<PGRState | null>(null);
  const [wave, setWave] = useState<1 | 2 | 3>(1);
  const [editingEntry, setEditingEntry] = useState<PGREntry | 'new' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

  const load = useCallback(async () => {
    const s = await api<PGRState>('/api/pgr/entries');
    setState(s);
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
  const waveAlreadySubmitted = waveEntries.length > 0 && waveEntries.every(e => e.submittedAt);

  async function handleDelete(id: string) {
    if (!confirm('Remove this team?')) return;
    const next = await api<PGRState>('/api/pgr/entries', 'DELETE', { id });
    setState(next);
  }

  async function handleSubmitWave() {
    if (waveEntries.length === 0) {
      setSubmitError(`No teams entered for Wave ${wave}.`);
      return;
    }
    if (waveAlreadySubmitted && !confirm(`Wave ${wave} was already submitted. Submit again?`)) return;
    setSubmitting(true);
    setSubmitError('');
    setSubmitMsg('');
    try {
      const next = await api<PGRState>('/api/pgr/submit', 'POST', { wave });
      setState(next);
      setSubmitMsg(`Wave ${wave} scores saved!`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  const waveCount = (w: number) => state.entries.filter(e => e.wave === w).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <a href="/" className="text-xs text-gray-400 font-medium uppercase tracking-wider leading-none mb-0.5 block hover:text-indigo-500 transition-colors">← Next View 2026</a>
          <h1 className="font-bold text-gray-900 text-lg leading-none">Pretty Good Race</h1>
        </div>
        <a href="/results" className="text-xs text-indigo-600 font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 active:bg-indigo-50">
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
                wave === w ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              Wave {w}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  wave === w ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Entry list */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-36 space-y-3">
        {waveEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-5xl mb-3">🏁</p>
            <p className="text-gray-500 text-sm font-medium">No teams in Wave {wave} yet.</p>
            <p className="text-gray-400 text-xs mt-1">Tap Add Team when the first team finishes.</p>
          </div>
        ) : (
          waveEntries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-4">
              {/* Top row: badges + actions */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap gap-1.5">
                  {entry.badges.map(b => (
                    <span key={b} className="bg-indigo-100 text-indigo-700 text-sm font-bold px-2.5 py-1 rounded-lg font-mono">
                      #{b}
                    </span>
                  ))}
                  {entry.submittedAt && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 font-semibold px-2.5 py-1 rounded-lg">
                      ✓ Submitted
                    </span>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingEntry(entry)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 active:bg-gray-100"
                    aria-label="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 active:bg-red-50 active:text-red-400"
                    aria-label="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Score grid */}
              <div className="grid grid-cols-4 gap-2">
                {([
                  ['Egypt', entry.egypt],
                  ['Caribbean', entry.caribbean],
                  ['Hollywood', entry.hollywood],
                  ['Australia', entry.australia],
                ] as [string, number][]).map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-xl py-3 text-center">
                    <p className="text-xs text-gray-400 leading-none mb-2">{label}</p>
                    <p className="text-2xl font-bold text-gray-800 leading-none">{val}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-3 text-right">
                Finish order: <span className="font-semibold text-gray-600">#{entry.order}</span>
              </p>
            </div>
          ))
        )}

        <button
          onClick={() => setEditingEntry('new')}
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-gray-500 font-semibold text-sm active:border-indigo-400 active:text-indigo-600 transition-colors"
        >
          + Add Team
        </button>
      </main>

      {/* Fixed submit footer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white/95 backdrop-blur border-t border-gray-200 px-4 pt-3 pb-8">
        {submitMsg && (
          <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5 mb-2 text-center font-medium">
            {submitMsg}
          </p>
        )}
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-2 text-center">
            {submitError}
          </p>
        )}
        <div className="flex justify-center">
          <button
            onClick={handleSubmitWave}
            disabled={submitting || waveEntries.length === 0}
            className={`w-full max-w-sm rounded-2xl py-4 font-bold text-base transition-colors disabled:opacity-40 ${
              waveAlreadySubmitted
                ? 'bg-emerald-600 text-white active:bg-emerald-700'
                : 'bg-indigo-600 text-white active:bg-indigo-700'
            }`}
          >
            {submitting
              ? 'Submitting…'
              : waveAlreadySubmitted
                ? `Resubmit Wave ${wave}`
                : `Submit Wave ${wave} Scores`}
          </button>
        </div>
      </div>

      {/* Modals */}
      {editingEntry !== null && (
        <EntryForm
          wave={wave}
          initial={editingEntry !== 'new' ? editingEntry : undefined}
          onSave={s => { setState(s); setEditingEntry(null); }}
          onCancel={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
