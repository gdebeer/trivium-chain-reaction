'use client';

import { useEffect, useState, useCallback } from 'react';
import type { BadgeResult, ResultsPayload } from '@/app/api/results/route';
import { BADGE_NAMES } from '@/lib/badge-list';

type View = 'scaled' | 'raw';

function fmt(n: number | null) {
  if (n === null) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-sm font-bold flex items-center justify-center">{rank}</span>;
}

function ScorePill({
  label, value, hasData, color,
}: { label: string; value: string; hasData: boolean; color: string }) {
  return (
    <div className={`flex-1 rounded-xl py-2 text-center ${hasData ? color : 'bg-gray-50'}`}>
      <p className="text-xs text-current opacity-60 leading-none mb-0.5">{label}</p>
      <p className="text-sm font-bold leading-none">{value}</p>
    </div>
  );
}

export default function ResultsPage() {
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<View>('scaled');

  const load = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch('/api/results', { cache: 'no-store' });
      setData(await res.json());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="text-gray-600 text-2xl animate-pulse">Loading…</span>
      </div>
    );
  }

  const { results, meta } = data;
  const displayed = showAll ? results : results.slice(0, 5);
  const hasAnyData = results.length > 0;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col w-full max-w-2xl mx-auto pb-12">
      {/* Header */}
      <header className="px-4 pt-8 pb-5">
        <a href="/" className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1 block hover:text-orange-400 transition-colors">← Next View 2026</a>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-black text-white leading-none">Leaderboard</h1>
          <button
            onClick={() => load()}
            disabled={refreshing}
            className="text-xs text-gray-500 font-medium px-3 py-1.5 rounded-lg border border-gray-800 active:bg-gray-800 disabled:opacity-40"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Scaled / Raw toggle */}
        <div className="flex mt-4 bg-gray-900 rounded-xl p-1 gap-1">
          {(['scaled', 'raw'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                view === v ? 'bg-gray-600 text-white' : 'text-gray-500 active:text-gray-400'
              }`}
            >
              {v === 'scaled' ? 'Scaled (ranked)' : 'Raw scores'}
            </button>
          ))}
        </div>

        {/* Station stat pills — always rendered so layout stays stable */}
        <div className="flex gap-2 mt-3">
          {([
            ['TTT',    meta.tttMax,    'indigo'],
            ['PGR',    meta.pgrMax,    'violet'],
            ['Launch', meta.launchMax, 'orange'],
          ] as [string, number | null, string][]).map(([label, max, _color]) => {
            const ready = max !== null;
            const sub = ready
              ? view === 'scaled' ? `÷ ${max}` : `best: ${max}`
              : 'no data';
            return (
              <div key={label} className={`flex-1 rounded-xl px-3 py-2 text-center ${ready ? 'bg-gray-800' : 'bg-gray-900 border border-gray-800'}`}>
                <p className={`text-xs font-bold ${ready ? 'text-white' : 'text-gray-600'}`}>{label}</p>
                <p className={`text-xs mt-0.5 ${ready ? 'text-gray-400' : 'text-gray-700'}`}>{sub}</p>
              </div>
            );
          })}
        </div>
      </header>

      {/* Leaderboard */}
      <main className="flex-1 px-4 space-y-2">
        {!hasAnyData ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🏆</p>
            <p className="text-gray-500 text-base font-medium">No scores recorded yet.</p>
            <p className="text-gray-600 text-sm mt-1">Scores will appear here once any station submits a wave.</p>
          </div>
        ) : (
          <>
            {displayed.map((r, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;

              const rankBg =
                rank === 1 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                rank === 2 ? 'bg-gray-400/10 border border-gray-400/20' :
                rank === 3 ? 'bg-orange-700/10 border border-orange-700/20' :
                'bg-gray-900 border border-gray-800';

              const totalColor =
                rank === 1 ? 'text-yellow-400' :
                rank === 2 ? 'text-gray-300' :
                rank === 3 ? 'text-orange-400' :
                'text-white';

              return (
                <div key={r.badge} className={`rounded-2xl px-4 py-3.5 ${rankBg}`}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <MedalIcon rank={rank} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-bold leading-tight ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
                        {BADGE_NAMES[r.badge] ?? `Badge ${r.badge}`}
                      </p>
                      <p className="text-xs text-gray-500 font-mono leading-none mt-0.5">#{r.badge}</p>
                    </div>
                    {view === 'scaled' && (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-2xl font-black tabular-nums ${totalColor}`}>
                          {r.total.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600 leading-none">/ 300</p>
                      </div>
                    )}
                  </div>

                  {view === 'scaled' ? (
                    <div className="flex gap-1.5">
                      <ScorePill label="TTT"    value={fmt(r.tttNorm)}    hasData={r.tttNorm !== null}    color="bg-indigo-950 text-indigo-300" />
                      <ScorePill label="PGR"    value={fmt(r.pgrNorm)}    hasData={r.pgrNorm !== null}    color="bg-violet-950 text-violet-300" />
                      <ScorePill label="Launch" value={fmt(r.launchNorm)} hasData={r.launchNorm !== null} color="bg-orange-950 text-orange-300" />
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <ScorePill label="TTT"    value={fmt(r.tttRaw)}    hasData={r.tttRaw !== null}    color="bg-indigo-950 text-indigo-300" />
                      <ScorePill label="PGR"    value={fmt(r.pgrRaw)}    hasData={r.pgrRaw !== null}    color="bg-violet-950 text-violet-300" />
                      <ScorePill label="Launch" value={fmt(r.launchRaw)} hasData={r.launchRaw !== null} color="bg-orange-950 text-orange-300" />
                    </div>
                  )}

                  {r.pgrOrder !== null && r.total > 0 && (
                    <p className="text-xs text-gray-700 mt-1.5 text-right">
                      PGR finish order: #{r.pgrOrder}
                    </p>
                  )}
                </div>
              );
            })}

            {results.length > 5 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full py-3 rounded-2xl border border-gray-800 text-gray-500 text-sm font-semibold active:bg-gray-900 mt-2"
              >
                {showAll ? 'Show top 5 only' : `Show all ${results.length} participants`}
              </button>
            )}
          </>
        )}
      </main>

      {/* Station links */}
      <footer className="px-4 pt-8">
        <p className="text-xs text-gray-700 font-semibold uppercase tracking-wider mb-3">Station Scorekeepers</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['/host', 'Tic Tac Talk', 'text-indigo-500'],
            ['/pgr', 'Pretty Good Race', 'text-violet-500'],
            ['/launch', '3-2-1 Launch', 'text-orange-500'],
          ].map(([href, label, color]) => (
            <a
              key={href as string}
              href={href as string}
              className="bg-gray-900 border border-gray-800 rounded-xl py-3 text-center active:bg-gray-800"
            >
              <p className={`text-xs font-bold ${color as string}`}>{label as string}</p>
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
