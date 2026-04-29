'use client';

import { useState } from 'react';

function TriviumLogo() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
      {/* Outer border ring */}
      <circle cx="26" cy="26" r="25" fill="#111" stroke="white" strokeWidth="1.5"/>
      {/* Inner border ring */}
      <circle cx="26" cy="26" r="23" fill="none" stroke="white" strokeWidth="0.6" opacity="0.5"/>

      {/* Top: bull's-eye (3 concentric circles) */}
      <circle cx="26" cy="14" r="6"   fill="none" stroke="white" strokeWidth="1.3"/>
      <circle cx="26" cy="14" r="3.2" fill="none" stroke="white" strokeWidth="1.3"/>
      <circle cx="26" cy="14" r="1"   fill="white"/>

      {/* Bottom-left: vertically split circle, left half filled */}
      <circle cx="19" cy="25" r="6" fill="none" stroke="white" strokeWidth="1.3"/>
      <path d="M19,19 A6,6 0 0,0 19,31 Z" fill="white"/>
      <line x1="19" y1="19" x2="19" y2="31" stroke="white" strokeWidth="1.3"/>

      {/* Bottom-right: horizontally striped circle */}
      <circle cx="33" cy="25" r="6" fill="none" stroke="white" strokeWidth="1.3"/>
      <line x1="27.2" y1="25"   x2="38.8" y2="25"   stroke="white" strokeWidth="1.3"/>
      <line x1="27.8" y1="21.8" x2="38.2" y2="21.8" stroke="white" strokeWidth="1.1"/>
      <line x1="27.8" y1="28.2" x2="38.2" y2="28.2" stroke="white" strokeWidth="1.1"/>

      {/* TRIVIUM */}
      <text x="26" y="39" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700"
            letterSpacing="1.5" fontFamily="Georgia, 'Times New Roman', serif">TRIVIUM</text>
      {/* GAMES */}
      <text x="26" y="46" textAnchor="middle" fill="white" fontSize="4.2"
            letterSpacing="3" fontFamily="Georgia, 'Times New Roman', serif">GAMES</text>
    </svg>
  );
}

function CatapultIceCream() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Chassis */}
      <rect x="2" y="27" width="21" height="3" rx="1.5" fill="#c2410c" />
      {/* Wheels */}
      <circle cx="7"  cy="32" r="2.5" stroke="#c2410c" strokeWidth="1.5" />
      <circle cx="18" cy="32" r="2.5" stroke="#c2410c" strokeWidth="1.5" />
      {/* Arm — raised after launch, pointing upper-left */}
      <line x1="21" y1="28" x2="8" y2="11" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" />
      {/* Pivot knuckle */}
      <circle cx="15" cy="21" r="2.5" fill="#c2410c" />
      {/* Trajectory dots */}
      <circle cx="15" cy="6"  r="1.2" fill="#fb923c" opacity="0.5" />
      <circle cx="21" cy="4"  r="1.2" fill="#fb923c" opacity="0.6" />
      <circle cx="26" cy="4"  r="1.2" fill="#fb923c" opacity="0.7" />
      {/* Ice cream cone (flying upper-right) */}
      {/* Cone */}
      <polygon points="27,14 33,14 30,20" fill="#f97316" />
      {/* Scoop — pink */}
      <circle cx="30" cy="10" r="5" fill="#fb7185" />
      {/* Scoop highlight */}
      <circle cx="28" cy="8"  r="1.5" fill="white" opacity="0.35" />
    </svg>
  );
}

function TicTacBoard() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Grid lines */}
      <line x1="13" y1="3"  x2="13" y2="33" stroke="#9333ea" strokeWidth="2"   strokeLinecap="round" />
      <line x1="23" y1="3"  x2="23" y2="33" stroke="#9333ea" strokeWidth="2"   strokeLinecap="round" />
      <line x1="3"  y1="13" x2="33" y2="13" stroke="#9333ea" strokeWidth="2"   strokeLinecap="round" />
      <line x1="3"  y1="23" x2="33" y2="23" stroke="#9333ea" strokeWidth="2"   strokeLinecap="round" />
      {/* X — top-left */}
      <line x1="5"  y1="5"  x2="11" y2="11" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="11" y1="5"  x2="5"  y2="11" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
      {/* O — top-right */}
      <circle cx="28" cy="8"  r="4" stroke="#0284c7" strokeWidth="2.5" />
      {/* X — centre */}
      <line x1="15" y1="15" x2="21" y2="21" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="21" y1="15" x2="15" y2="21" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
      {/* O — bottom-left */}
      <circle cx="8"  cy="28" r="4" stroke="#0284c7" strokeWidth="2.5" />
    </svg>
  );
}

type Station = {
  href: string;
  icon: React.ReactNode;
  name: string;
  card: string;
  text: string;
};

const STATIONS: Station[] = [
  {
    href: '/pgr',
    icon: <span className="text-3xl">🏁</span>,
    name: 'Pretty Good Race',
    card: 'border-indigo-200 active:bg-indigo-50',
    text: 'text-indigo-700',
  },
  {
    href: '/host',
    icon: <TicTacBoard />,
    name: 'Tic Tac Talk',
    card: 'border-purple-200 active:bg-purple-50',
    text: 'text-purple-700',
  },
  {
    href: '/launch',
    icon: <CatapultIceCream />,
    name: '3-2-1 Launch',
    card: 'border-orange-200 active:bg-orange-50',
    text: 'text-orange-700',
  },
];

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
    <div className="min-h-screen bg-gray-950 flex flex-col w-full max-w-2xl mx-auto">
      {/* Header */}
      <header className="px-6 pt-10 pb-8">
        {/* Company brand */}
        <div className="flex items-center gap-3 mb-6">
          <TriviumLogo />
          <div>
            <p className="text-white font-bold text-base tracking-[0.18em]">TRIVIUM</p>
            <p className="text-gray-500 text-xs tracking-[0.22em]">GAMES</p>
          </div>
        </div>
        {/* Event */}
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">Staff Portal</p>
        <h1 className="text-white font-black tracking-tight" style={{ fontSize: 'clamp(2rem, 9vw, 3rem)', lineHeight: 1 }}>
          Next View <span className="text-orange-400">2026</span>
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
            <span className="flex-shrink-0 w-9 flex items-center justify-center">{s.icon}</span>
            <p className={`flex-1 font-bold text-base ${s.text}`}>{s.name}</p>
            <span className="text-gray-300 text-xl flex-shrink-0">›</span>
          </a>
        ))}

        {/* Results */}
        <a
          href="/results"
          className="flex items-center gap-4 bg-amber-50 rounded-2xl px-4 py-4 border-2 border-amber-200 active:bg-amber-100 transition-colors mt-2"
        >
          <span className="text-3xl flex-shrink-0">🏆</span>
          <p className="flex-1 font-bold text-base text-amber-700">Results Leaderboard</p>
          <span className="text-gray-300 text-xl flex-shrink-0">›</span>
        </a>

        {/* Participant display */}
        <a
          href="/display"
          className="flex items-center gap-4 bg-gray-800 rounded-2xl px-4 py-4 border-2 border-gray-700 active:bg-gray-700 transition-colors"
        >
          <span className="text-3xl flex-shrink-0">📺</span>
          <p className="flex-1 font-bold text-base text-gray-200">TTT Participant Display</p>
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
