'use client';

import { useEffect, useState, useRef } from 'react';
import type { GameState } from '@/lib/types';

// Strip any "B - " letter prefix so the participant never sees it
function displayWord(raw: string): string {
  const t = raw.trim();
  if (t.length >= 3 && /[A-Za-z]/.test(t[0])) {
    if (t[1] === ' ' && t[2] === '-' && t[3] === ' ') return t.slice(4);
    if (t[1] === ':' && t[2] === ' ')                  return t.slice(3);
    if (t[1] === '-' && t[2] === ' ')                  return t.slice(3);
  }
  return t;
}

// Stop polling after 4 hours of continuous visibility — enough for any event.
const MAX_ACTIVE_MS = 4 * 60 * 60 * 1000;

export default function DisplayPage() {
  const [state, setState] = useState<GameState | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [stopped, setStopped] = useState(false);
  const lastSig = useRef('');
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (!mounted || document.hidden) return;
      if (Date.now() - startedAt.current > MAX_ACTIVE_MS) {
        if (intervalId) clearInterval(intervalId);
        setStopped(true);
        return;
      }
      try {
        const res = await fetch('/api/game', { cache: 'no-store' });
        if (!res.ok || !mounted) return;
        const data: GameState = await res.json();
        const sig = `${data.status}:${data.currentWord}`;
        if (sig !== lastSig.current) {
          lastSig.current = sig;
          setAnimKey(k => k + 1);
        }
        setState(data);
      } catch {
        // network hiccup — retry next tick
      }
    };

    // Resume polling when tab becomes visible again
    const onVisibilityChange = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    poll();
    intervalId = setInterval(poll, 1000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  if (stopped) {
    return (
      <div className="bg-black flex flex-col items-center justify-center gap-6" style={{ height: '100dvh' }}>
        <p className="text-gray-600 text-xl">Display timed out.</p>
        <button
          onClick={() => { startedAt.current = Date.now(); setStopped(false); }}
          className="px-6 py-3 bg-white text-black font-semibold rounded-xl text-sm"
        >
          Resume
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="bg-black flex items-center justify-center" style={{ height: '100dvh' }}>
        <span className="text-gray-800 text-4xl animate-pulse">●</span>
      </div>
    );
  }

  return (
    <div className="bg-black flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {state.scoreVisible ? (
        <div className="flex-1 flex items-center justify-center gap-28 px-10">
          <div className="flex flex-col items-center gap-2">
            <span className="text-orange-500 font-black uppercase tracking-widest border-b-4 border-orange-500 pb-1" style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}>X</span>
            <span className="text-orange-400 font-black leading-none" style={{ fontSize: 'clamp(8rem, 28vw, 22rem)' }}>{state.displayXScore ?? 0}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sky-400 font-black uppercase tracking-widest border-b-4 border-sky-400 pb-1" style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}>O</span>
            <span className="text-sky-300 font-black leading-none" style={{ fontSize: 'clamp(8rem, 28vw, 22rem)' }}>{state.displayOScore ?? 0}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div key={animKey} className="word-reveal text-center max-w-5xl w-full">
            {state.status === 'waiting' || !state.currentWord ? (
              <p
                className="text-gray-600 font-light tracking-[0.25em] uppercase"
                style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}
              >
                Waiting…
              </p>
            ) : (
              <p
                className="text-white font-black leading-none break-words"
                style={{ fontSize: 'clamp(3rem, 14vw, 9rem)' }}
              >
                {displayWord(state.currentWord)}
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes wordReveal {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .word-reveal {
          animation: wordReveal 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
