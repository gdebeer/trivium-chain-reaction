'use client';

import { useEffect, useState } from 'react';
import type { GameState } from '@/lib/types';

// Strip any "B - " letter prefix so the participant never sees it
function displayWord(raw: string): string {
  const match = raw.match(/^[A-Za-z]\s*[-:]\s*(.+)$/);
  return match ? match[1].trim() : raw;
}

export default function DisplayPage() {
  const [state, setState] = useState<GameState | null>(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    let lastSig = '';

    const poll = async () => {
      try {
        const res = await fetch('/api/game', { cache: 'no-store' });
        if (!res.ok || !mounted) return;
        const data: GameState = await res.json();
        const sig = `${data.status}:${data.currentWord}`;
        if (sig !== lastSig) {
          lastSig = sig;
          setAnimKey(k => k + 1);
        }
        setState(data);
      } catch {
        // network hiccup — retry next tick
      }
    };

    poll();
    const id = setInterval(poll, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-gray-800 text-4xl animate-pulse">●</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 overflow-hidden">
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
