'use client';

import { useEffect, useState, useCallback } from 'react';
import type { GameState, Round } from '@/lib/types';
import type { TTTState, TTTWave } from '@/lib/ttt-types';
import { tttDefaultTeams, VALID_BADGE_SET, BADGE_NAMES } from '@/lib/badge-list';

// ─── API helpers ────────────────────────────────────────────────────────────

async function tttApi<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

async function sendAction(body: object): Promise<GameState> {
  const res = await fetch('/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Word parsing ────────────────────────────────────────────────────────────

// Supports optional "B - Plumber" format. Returns letter (for host display)
// and word (sent to participants). Plain words with no letter prefix also work.
function parseWord(raw: string): { letter: string | null; word: string; starred: boolean } {
  let t = raw.trim();
  const starred = t.startsWith('*');
  if (starred) t = t.slice(1).trim();
  if (t.length >= 3 && /[A-Za-z]/.test(t[0])) {
    if (t[1] === ' ' && t[2] === '-' && t[3] === ' ') return { letter: t[0].toUpperCase(), word: t.slice(4), starred };
    if (t[1] === ':' && t[2] === ' ')                  return { letter: t[0].toUpperCase(), word: t.slice(3), starred };
    if (t[1] === '-' && t[2] === ' ')                  return { letter: t[0].toUpperCase(), word: t.slice(3), starred };
  }
  return { letter: null, word: t, starred };
}

// ─── Round editor modal ──────────────────────────────────────────────────────

interface RoundEditorProps {
  initial?: Round;
  onSave: (name: string, words: string[]) => void;
  onCancel: () => void;
}

function RoundEditor({ initial, onSave, onCancel }: RoundEditorProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [wordsText, setWordsText] = useState(initial?.words.join('\n') ?? '');

  function handleSave() {
    const words = wordsText
      .split('\n')
      .map(w => w.trim())
      .filter(Boolean);
    if (!name.trim() || words.length === 0) return;
    onSave(name.trim(), words);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={onCancel}>
      <div
        className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {initial ? 'Edit Round' : 'New Round'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Round name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Round 1 — Animals"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Words <span className="text-gray-400 font-normal">(one per line — optionally prefix with key letter)</span>
          </label>
          <textarea
            value={wordsText}
            onChange={e => setWordsText(e.target.value)}
            placeholder={"B - Plumber\nG - Gnome\nK - Knight\n\nor just:\nElephant\nGiraffe"}
            rows={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white font-semibold rounded-xl py-3 text-base active:bg-indigo-700"
        >
          Save Round
        </button>
      </div>
    </div>
  );
}

// ─── TTT Badge modal ─────────────────────────────────────────────────────────

function TTTBadgeModal({
  wave,
  tttState: initialTttState,
  currentScores,
  onSave,
  onCancel,
}: {
  wave: 1 | 2 | 3;
  tttState: TTTState | null;
  currentScores: { x: number; o: number };
  onSave: (next: TTTState) => void;
  onCancel: () => void;
}) {
  // Keep a local copy of tttState so cross-wave removals update it immediately
  const [localTttState, setLocalTttState] = useState<TTTState | null>(initialTttState);
  const savedWave = localTttState?.waves.find(wv => wv.wave === wave);
  const defaults = tttDefaultTeams(wave);

  const [xBadges, setXBadges] = useState<string[]>(
    savedWave?.xBadges.length ? [...savedWave.xBadges] : [...defaults.x]
  );
  const [oBadges, setOBadges] = useState<string[]>(
    savedWave?.oBadges.length ? [...savedWave.oBadges] : [...defaults.o]
  );
  const [saving, setSaving] = useState(false);
  const [addInput, setAddInput] = useState<{ x: string; o: string }>({ x: '', o: '' });
  const [addMsg, setAddMsg] = useState('');

  function defaultTeam(badge: string): 'x' | 'o' {
    const last = parseInt(badge.at(-1) ?? '', 10);
    return !isNaN(last) && last % 2 !== 0 ? 'x' : 'o';
  }

  function moveBadge(b: string, from: 'x' | 'o') {
    if (from === 'x') {
      setXBadges(p => p.filter(x => x !== b));
      setOBadges(p => [...p, b].sort());
    } else {
      setOBadges(p => p.filter(x => x !== b));
      setXBadges(p => [...p, b].sort());
    }
  }

  async function addBadge(team: 'x' | 'o') {
    const b = addInput[team].trim();
    if (!b) return;
    setAddMsg('');

    // Already in this wave?
    if (xBadges.includes(b) || oBadges.includes(b)) {
      setAddMsg(`⚠ ${b} is already in this wave.`);
      return;
    }

    // In a different wave? Ask before moving.
    if (localTttState) {
      for (const wv of localTttState.waves) {
        if (wv.wave === wave) continue;
        const inX = wv.xBadges.includes(b);
        const inO = wv.oBadges.includes(b);
        if (inX || inO) {
          const name = BADGE_NAMES[b] ? ` (${BADGE_NAMES[b]})` : '';
          const ok = confirm(
            `Badge ${b}${name} is already in Wave ${wv.wave} — Team ${inX ? 'X' : 'O'}.\n\nRemove it from Wave ${wv.wave} and add it here?`
          );
          if (!ok) return;
          // Remove from the other wave and persist
          const updated = await tttApi<TTTState>('/api/ttt/waves', 'POST', {
            wave: wv.wave,
            xBadges: inX ? wv.xBadges.filter(x => x !== b) : wv.xBadges,
            oBadges: !inX ? wv.oBadges.filter(x => x !== b) : wv.oBadges,
            xScore: wv.xScore,
            oScore: wv.oScore,
            submittedAt: wv.submittedAt,
          } as TTTWave);
          setLocalTttState(updated);
          break;
        }
      }
    }

    // Add to chosen team
    if (team === 'x') {
      setXBadges(p => [...p, b].sort());
      setAddInput(a => ({ ...a, x: '' }));
    } else {
      setOBadges(p => [...p, b].sort());
      setAddInput(a => ({ ...a, o: '' }));
    }

    // Feedback
    if (!VALID_BADGE_SET.has(b)) {
      setAddMsg(`⚠ ${b} is not a recognised badge number — added anyway.`);
    } else {
      const name = BADGE_NAMES[b];
      setAddMsg(name ? `✓ Added ${name} to Team ${team.toUpperCase()}.` : `✓ Added ${b} to Team ${team.toUpperCase()}.`);
      setTimeout(() => setAddMsg(''), 2500);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const waveData: TTTWave = {
        wave, xBadges, oBadges,
        xScore: currentScores.x,
        oScore: currentScores.o,
        submittedAt: savedWave?.submittedAt,
      };
      const next = await tttApi<TTTState>('/api/ttt/waves', 'POST', waveData);
      onSave(next);
    } finally {
      setSaving(false);
    }
  }

  const teamCol = (team: 'x' | 'o') => {
    const badges = team === 'x' ? xBadges : oBadges;
    const label = team === 'x' ? 'Team X' : 'Team O';
    const textColor = team === 'x' ? 'text-orange-600' : 'text-sky-500';
    const borderColor = team === 'x' ? 'border-orange-100' : 'border-sky-100';
    return (
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${textColor} mb-1.5`}>{label}</p>
        <div className={`flex flex-wrap content-start gap-1.5 p-2 bg-gray-50 rounded-xl border ${borderColor} min-h-16 mb-2`}>
          {badges.map(b => {
            const isOverride = defaultTeam(b) !== team;
            const chipBase = isOverride
              ? 'border-2 border-amber-400 bg-amber-50'
              : 'border border-gray-200 bg-white';
            return (
              <div key={b} className={`flex items-center rounded-lg text-xs font-mono overflow-hidden ${chipBase}`}>
                <button
                  onClick={() => moveBadge(b, team)}
                  title={`Move to Team ${team === 'x' ? 'O' : 'X'}`}
                  className={`flex items-center gap-1 pl-2.5 pr-2 py-2 active:opacity-70 ${isOverride ? 'font-bold' : ''}`}
                >
                  {b} <span className="text-gray-400 text-xs">⇄</span>
                </button>
                <button
                  onClick={() => {
                    const name = BADGE_NAMES[b] ? ` (${BADGE_NAMES[b]})` : '';
                    if (!confirm(`Remove badge ${b}${name} from Wave ${wave}?`)) return;
                    if (team === 'x') setXBadges(p => p.filter(x => x !== b));
                    else setOBadges(p => p.filter(x => x !== b));
                  }}
                  title="Remove from wave"
                  className="px-2.5 py-2 text-sm text-gray-300 active:text-red-500 border-l border-gray-200"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        {/* Add badge input */}
        <div className="flex gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={addInput[team]}
            onChange={e => setAddInput(a => ({ ...a, [team]: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') addBadge(team); }}
            placeholder="Add badge #"
            maxLength={3}
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={() => addBadge(team)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-white active:bg-gray-700 flex-shrink-0"
          >
            Add
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={onCancel}>
      <div
        className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto max-w-2xl mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Wave {wave} — Badge Assignments</h2>
          <button onClick={onCancel} className="text-gray-400 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <p className="text-xs text-gray-400 -mt-2">Tap a badge to swap teams. Amber = moved from default. Use inputs to add someone not on the list.</p>
        {addMsg && (
          <p className={`text-xs px-3 py-2 rounded-lg ${addMsg.startsWith('⚠') ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>
            {addMsg}
          </p>
        )}
        <div className="flex gap-3">
          {teamCol('x')}
          {teamCol('o')}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 text-white font-semibold rounded-xl py-3 text-sm active:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Badge Assignments'}
        </button>
      </div>
    </div>
  );
}

// ─── Control tab ─────────────────────────────────────────────────────────────

interface ControlTabProps {
  state: GameState;
  onAction: (s: GameState) => void;
}

function ControlTab({ state, onAction }: ControlTabProps) {
  const [activeRound, setActiveRound] = useState<string | null>(
    state.rounds[0]?.id ?? null
  );
  const [wave, setWave] = useState<1 | 2 | 3>(1);
  const [scores, setScores] = useState({ x: 0, o: 0 });
  const [tttState, setTttState] = useState<TTTState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    tttApi<TTTState>('/api/ttt/waves').then(s => {
      setTttState(s);
      // Pre-load scores for wave 1 if already saved
      const saved = s.waves.find(wv => wv.wave === 1);
      if (saved) setScores({ x: saved.xScore, o: saved.oScore });
    });
  }, []);

  function switchWave(w: 1 | 2 | 3) {
    setWave(w);
    // Restore saved scores for the target wave, or 0 if not yet submitted
    const saved = tttState?.waves.find(wv => wv.wave === w);
    setScores({ x: saved?.xScore ?? 0, o: saved?.oScore ?? 0 });
    setSubmitMsg('');
  }

  const adjust = (team: 'x' | 'o', delta: number) =>
    setScores(s => ({ ...s, [team]: Math.max(0, s[team] + delta) }));

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const { x: xBadges, o: oBadges } = tttDefaultTeams(wave);
      const waveData: TTTWave = {
        wave, xBadges, oBadges,
        xScore: scores.x, oScore: scores.o,
        submittedAt: new Date().toISOString(),
      };
      const next = await tttApi<TTTState>('/api/ttt/waves', 'POST', waveData);
      setTttState(next);
      setSubmitMsg(`Wave ${wave} saved!`);
    } catch { /* silent */ } finally {
      setSubmitting(false);
    }
  }

  const showWord = useCallback(async (word: string) => {
    const next = await sendAction({ type: 'SHOW_WORD', word });
    onAction(next);
  }, [onAction]);

  const showWaiting = useCallback(async () => {
    const next = await sendAction({ type: 'SHOW_WAITING' });
    onAction(next);
  }, [onAction]);

  const round = state.rounds.find(r => r.id === activeRound);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        showWaiting();
        return;
      }
      const key = e.key.toUpperCase();
      if (key.length === 1 && /[A-Z]/.test(key) && round) {
        const match = round.words.find(raw => parseWord(raw).letter === key);
        if (match) showWord(parseWord(match).word);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [round, showWord, showWaiting]);

  return (
    <div className="flex flex-col h-full">
      {/* Wave selector */}
      <div className="px-4 pt-3 pb-3 flex gap-2 border-b border-gray-100 flex-shrink-0">
        {([1, 2, 3] as const).map(w => {
          const saved = tttState?.waves.some(wv => wv.wave === w && wv.submittedAt);
          return (
            <button
              key={w}
              onClick={() => switchWave(w)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                wave === w ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              Wave {w}{saved ? ' ✓' : ''}
            </button>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${state.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {state.status === 'active' && state.currentWord
              ? <>Showing: <span className="font-semibold text-gray-900">{state.currentWord}</span></>
              : <span className="text-gray-400">Showing waiting screen</span>}
          </span>
        </div>
      </div>

      {state.rounds.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <div>
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">No rounds set up yet.</p>
            <p className="text-gray-400 text-sm mt-1">Go to Setup to add rounds.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Round tabs */}
          <div className="px-4 pb-2 overflow-x-auto flex-shrink-0">
            <div className="flex gap-2 pb-1">
              {state.rounds.map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveRound(r.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeRound === r.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Word grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-2">
            {round ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {round.words.map(raw => {
                  const { letter, word } = parseWord(raw);
                  const isActive = state.status === 'active' && state.currentWord === word;
                  return (
                    <button
                      key={raw}
                      onClick={() => showWord(word)}
                      className={`px-4 py-2.5 rounded-xl font-medium text-base transition-colors flex items-center gap-2 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white border-2 border-gray-200 text-gray-800 active:bg-indigo-50 active:border-indigo-300'
                      }`}
                    >
                      {letter && (
                        <span className={`text-xs font-black px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-white'
                        }`}>
                          {letter}
                        </span>
                      )}
                      {word}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Waiting button — below word grid */}
          <div className="px-4 py-3 flex-shrink-0">
            <button
              onClick={showWaiting}
              className={`w-full rounded-xl py-3 font-semibold text-base border-2 transition-colors ${
                state.status === 'waiting'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-800 active:bg-indigo-50 active:border-indigo-300'
              }`}
            >
              Show Waiting Screen
            </button>
          </div>

          {/* Participant view preview */}
          <div className="px-4 pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Participant screen</p>
              <a
                href="/display"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 font-semibold"
              >
                Open Display ↗
              </a>
            </div>
            <div className="bg-black rounded-2xl h-28 flex items-center justify-center overflow-hidden">
              {state.status === 'waiting' || !state.currentWord ? (
                <p className="text-gray-600 text-sm font-light tracking-widest uppercase">Waiting…</p>
              ) : (
                <p className="text-white font-black text-center px-4 leading-none"
                   style={{ fontSize: 'clamp(1.25rem, 6vw, 2.5rem)' }}>
                  {state.currentWord}
                </p>
              )}
            </div>
          </div>

          {/* Scoring */}
          <div className="px-4 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Score — Wave {wave}</p>
              <button
                onClick={() => setShowBadges(true)}
                className="text-xs text-indigo-600 font-semibold active:opacity-70"
              >
                Edit Badges ›
              </button>
            </div>
            <div className="flex gap-3 mb-2">
              {([['x', 'X', 'text-orange-600', 'bg-orange-600', 'border-orange-200'],
                 ['o', 'O', 'text-sky-400',    'bg-sky-400',    'border-sky-200'  ]] as const).map(
                ([team, label, textColor, bgColor, borderColor]) => (
                <div key={team} className={`flex-1 border-2 ${borderColor} rounded-2xl px-3 py-2.5 flex items-center justify-between gap-2`}>
                  <button
                    onClick={() => adjust(team, -1)}
                    className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center active:bg-gray-200 flex-shrink-0"
                  >
                    −
                  </button>
                  <div className="flex flex-col items-center min-w-0">
                    <span className={`text-4xl font-black uppercase ${textColor}`}>{label}</span>
                    <span className={`text-3xl font-black ${textColor} leading-none`}>{scores[team]}</span>
                  </div>
                  <button
                    onClick={() => adjust(team, 1)}
                    className={`w-9 h-9 rounded-xl ${bgColor} text-white font-bold text-lg flex items-center justify-center active:opacity-80 flex-shrink-0`}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
            {submitMsg && (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2 mb-2 text-center font-medium">{submitMsg}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl border-2 border-indigo-500 text-indigo-600 bg-white font-semibold text-sm active:bg-indigo-50 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : `Submit Wave ${wave} Scores`}
            </button>
          </div>

          {/* Letter grid */}
          {(() => {
            const parsed = (round?.words ?? []).map(parseWord);
            const starred = parsed.filter(p => p.starred && p.letter);
            const rest    = parsed.filter(p => !p.starred && p.letter);
            if (starred.length === 0 && rest.length === 0) return null;
            const activeLetterWord = state.status === 'active' ? state.currentWord : null;
            const isActive = (letter: string) =>
              !!activeLetterWord && parsed.some(p => p.letter === letter && p.word === activeLetterWord);
            const cells = Array.from({ length: 9 }, (_, i) => starred[i]?.letter ?? null);
            return (
              <div className="px-4 pb-4 flex-shrink-0 space-y-2">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Board Setup</p>
                {starred.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5" style={{ width: 'fit-content' }}>
                    {cells.map((letter, i) => (
                      <div
                        key={i}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg font-black text-base transition-colors ${
                          letter
                            ? isActive(letter)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-800 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                )}
                {rest.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rest.map(({ letter }) => (
                      <div
                        key={letter}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm transition-colors ${
                          isActive(letter!)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {showBadges && (
        <TTTBadgeModal
          wave={wave}
          tttState={tttState}
          currentScores={scores}
          onSave={next => { setTttState(next); setShowBadges(false); }}
          onCancel={() => setShowBadges(false)}
        />
      )}
    </div>
  );
}

// ─── Setup tab ────────────────────────────────────────────────────────────────

interface SetupTabProps {
  state: GameState;
  onAction: (s: GameState) => void;
}

function SetupTab({ state, onAction }: SetupTabProps) {
  const [editing, setEditing] = useState<Round | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleSave(name: string, words: string[], id?: string) {
    const next = await sendAction({ type: 'SAVE_ROUND', round: { id, name, words } });
    onAction(next);
    setEditing(null);
    setAdding(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this round?')) return;
    const next = await sendAction({ type: 'DELETE_ROUND', id });
    onAction(next);
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const idx = state.rounds.findIndex(r => r.id === id);
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= state.rounds.length) return;
    const ids = state.rounds.map(r => r.id);
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    const next = await sendAction({ type: 'REORDER_ROUNDS', ids });
    onAction(next);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-gray-900">Rounds</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {state.rounds.length === 0 && (
          <p className="text-gray-400 text-sm py-4 text-center">No rounds yet — add one below.</p>
        )}
        {state.rounds.map((round, idx) => (
          <div key={round.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={() => handleMove(round.id, 'up')}
                disabled={idx === 0}
                className="w-7 h-7 flex items-center justify-center rounded text-gray-400 disabled:opacity-20 active:bg-gray-100"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                onClick={() => handleMove(round.id, 'down')}
                disabled={idx === state.rounds.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded text-gray-400 disabled:opacity-20 active:bg-gray-100"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm">{round.name}</p>
              <p className="text-gray-400 text-xs mt-0.5 truncate">
                {round.words.join(' · ')}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setEditing(round)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="Edit"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(round.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-gray-500 font-medium text-sm active:border-indigo-400 active:text-indigo-600"
        >
          + Add Round
        </button>
      </div>

      {(editing || adding) && (
        <RoundEditor
          initial={editing ?? undefined}
          onSave={(name, words) => handleSave(name, words, editing?.id)}
          onCancel={() => { setEditing(null); setAdding(false); }}
        />
      )}
    </div>
  );
}

// ─── Host page ────────────────────────────────────────────────────────────────

// ─── Help modal ───────────────────────────────────────────────────────────────

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto space-y-5 max-w-2xl mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">How to use</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">⚙️ Setup</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>Tap <strong>Setup</strong> to add, edit, or reorder rounds.</li>
            <li>Each round has a name and a list of words — one per line.</li>
            <li>To assign a key letter to a word, prefix it with the letter and a dash:<br/>
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">B - Plumber</code>
              <span className="text-gray-500 text-xs ml-2">→ shows as <strong>B</strong> Plumber on this screen</span>
            </li>
            <li>Add <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">*</code> at the start to feature that word in the 3×3 grid (up to 9):<br/>
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">* B - Plumber</code>
            </li>
            <li>Use <strong>▲ ▼</strong> to reorder rounds without changing their content.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">🎮 Control</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>Tap any word button to show it on the participant display.</li>
            <li>The active word is highlighted in purple — tap another to switch.</li>
            <li>Use the round tabs to switch between rounds.</li>
            <li>Tap <strong>Show Waiting Screen</strong> between rounds to hide the current word.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">⌨️ Keyboard shortcuts</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>Press a <strong>letter key</strong> to instantly select the matching word in the active round.</li>
            <li>Press <strong>Space</strong> to show the waiting screen.</li>
            <li>Shortcuts are ignored when typing in a text field.</li>
          </ul>
        </section>

        <button
          onClick={onClose}
          className="w-full bg-indigo-600 text-white font-semibold rounded-xl py-3 text-sm active:bg-indigo-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

// ─── Host page ────────────────────────────────────────────────────────────────

type Tab = 'control' | 'setup';

export default function HostPage() {
  const [state, setState] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>('control');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetch('/api/game')
      .then(r => r.json())
      .then(setState);
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400 text-2xl animate-pulse">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <a href="/" className="text-xs text-gray-400 font-medium uppercase tracking-wider leading-none mb-0.5 block hover:text-purple-500 transition-colors">← Next View 2026</a>
          <h1 className="font-bold text-gray-900 text-lg leading-none">Tic Tac Talk</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelp(true)}
            className="w-7 h-7 rounded-full border-2 border-gray-300 text-gray-500 text-sm font-bold flex items-center justify-center active:bg-gray-100"
            aria-label="Help"
          >
            ?
          </button>
          <a href="/results" className="text-xs text-indigo-600 font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 active:bg-indigo-50">
            Results ↗
          </a>
        </div>
      </header>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'control' && <ControlTab state={state} onAction={setState} />}
        {tab === 'setup' && <SetupTab state={state} onAction={setState} />}
      </main>

      {/* Bottom tab bar */}
      <nav className="bg-white border-t border-gray-200 flex flex-shrink-0">
        {([
          ['control', '🎮 Control'],
          ['setup', '⚙️ Setup'],
        ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              tab === t ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
