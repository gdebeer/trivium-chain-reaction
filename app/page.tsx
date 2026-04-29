'use client';

import { useState } from 'react';

const STATIONS = [
  {
    href: '/pgr',
    emoji: '🏁',
    name: 'Pretty Good Race',
    desc: 'Obstacle-course scoring · 3 waves',
    card: 'border-indigo-200 active:bg-indigo-50',
    text: 'text-indigo-700',
  },
  {
    href: '/host',
    emoji: '🎮',
    name: 'Tic Tac Talk',
    desc: 'Trivia word game host controller',
    card: 'border-purple-200 active:bg-purple-50',
    text: 'text-purple-700',
  },
  {
    href: '/launch',
    emoji: '🚀',
    name: '3-2-1 Launch',
    desc: 'Catapult scoring · 5 teams per wave',
    card: 'border-orange-200 active:bg-orange-50',
    text: 'text-orange-700',
  },
] as const;

export default function HomePage() {
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function handleReset() {
    if (!confirm(
      'Reset ALL scores and badge assignments across every station?\n\nThis cannot be undone.'
    )) return;
    setResetting(true);
    setResetDone(false);
    try {
      await fetch('/api/reset', { method: 'POST' });
      setResetDone(true);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="px-6 pt-14 pb-8">
        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">Staff Portal</p>
        <h1 className="text-white font-black tracking-tight" style={{ fontSize: 'clamp(2.5rem, 10vw, 3.5rem)', lineHeight: 1 }}>
          Next View<br />
          <span className="text-orange-400">2026</span>
        </h1>
      </header>

      <main className="flex-1 px-4 pb-16 space-y-2">

        {/* Stations */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 pb-1">Stations</p>

        {STATIONS.map(s => (
          <a
            key={s.href}
            href={s.href}
            className={`flex items-center gap-4 bg-white rounded-2xl px-4 py-4 border-2 ${s.card} transition-colors`}
          >
            <span className="text-3xl flex-shrink-0">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-base ${s.text}`}>{s.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </div>
            <span className="text-gray-300 text-xl flex-shrink-0">›</span>
          </a>
        ))}

        {/* Results */}
        <a
          href="/results"
          className="flex items-center gap-4 bg-amber-50 rounded-2xl px-4 py-4 border-2 border-amber-200 active:bg-amber-100 transition-colors mt-2"
        >
          <span className="text-3xl flex-shrink-0">🏆</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-amber-700">Results Leaderboard</p>
            <p className="text-xs text-gray-400 mt-0.5">Live scores across all stations</p>
          </div>
          <span className="text-gray-300 text-xl flex-shrink-0">›</span>
        </a>

        {/* Participant display */}
        <a
          href="/display"
          className="flex items-center gap-4 bg-gray-800 rounded-2xl px-4 py-4 border-2 border-gray-700 active:bg-gray-700 transition-colors"
        >
          <span className="text-3xl flex-shrink-0">📺</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-gray-200">TTT Participant Display</p>
            <p className="text-xs text-gray-500 mt-0.5">Show on the big screen during Tic Tac Talk</p>
          </div>
          <span className="text-gray-600 text-xl flex-shrink-0">›</span>
        </a>

        {/* Reset */}
        <div className="mt-6 rounded-2xl p-4 border border-red-900/50 bg-red-950/30">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Danger Zone</p>
          <p className="text-sm text-gray-400 mb-3">
            Clears all scores and badge assignments across every station. Use for testing, then reset before the real event.
          </p>
          {resetDone && (
            <p className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-2 rounded-xl mb-3 text-center font-medium">
              ✓ All data cleared — ready for the event
            </p>
          )}
          <button
            onClick={handleReset}
            disabled={resetting}
            className="w-full bg-red-600 text-white font-bold rounded-xl py-3.5 text-sm active:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {resetting ? 'Resetting…' : 'Reset All Event Data'}
          </button>
        </div>

      </main>
    </div>
  );
}
