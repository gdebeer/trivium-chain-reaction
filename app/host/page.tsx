'use client';

import { useEffect, useState, useCallback } from 'react';
import type { GameState, Round } from '@/lib/types';

// ─── API helpers ────────────────────────────────────────────────────────────

async function sendAction(body: object): Promise<GameState> {
  const res = await fetch('/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
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
            Words <span className="text-gray-400 font-normal">(one per line)</span>
          </label>
          <textarea
            value={wordsText}
            onChange={e => setWordsText(e.target.value)}
            placeholder={"Cat\nDog\nElephant\nGiraffe"}
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

// ─── Control tab ─────────────────────────────────────────────────────────────

interface ControlTabProps {
  state: GameState;
  onAction: (s: GameState) => void;
}

function ControlTab({ state, onAction }: ControlTabProps) {
  const [activeRound, setActiveRound] = useState<string | null>(
    state.rounds[0]?.id ?? null
  );

  const showWord = useCallback(async (word: string) => {
    const next = await sendAction({ type: 'SHOW_WORD', word });
    onAction(next);
  }, [onAction]);

  const showWaiting = useCallback(async () => {
    const next = await sendAction({ type: 'SHOW_WAITING' });
    onAction(next);
  }, [onAction]);

  const round = state.rounds.find(r => r.id === activeRound);

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="px-4 pt-4 pb-3">
        <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${state.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {state.status === 'active' && state.currentWord
              ? <>Showing: <span className="font-semibold text-gray-900">{state.currentWord}</span></>
              : <span className="text-gray-400">Showing waiting screen</span>}
          </span>
        </div>
      </div>

      {/* Waiting button */}
      <div className="px-4 pb-4">
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
          <div className="px-4 pb-2 overflow-x-auto">
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
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {round ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {round.words.map(word => {
                  const isActive = state.status === 'active' && state.currentWord === word;
                  return (
                    <button
                      key={word}
                      onClick={() => showWord(word)}
                      className={`px-4 py-2.5 rounded-xl font-medium text-base transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white border-2 border-gray-200 text-gray-800 active:bg-indigo-50 active:border-indigo-300'
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </>
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

type Tab = 'control' | 'setup';

export default function HostPage() {
  const [state, setState] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>('control');

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
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="font-bold text-gray-900 text-base">Chain Reaction</h1>
        <a
          href="/display"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 font-medium"
        >
          Display ↗
        </a>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'control'
          ? <ControlTab state={state} onAction={setState} />
          : <SetupTab state={state} onAction={setState} />}
      </main>

      {/* Bottom tab bar */}
      <nav className="bg-white border-t border-gray-200 flex flex-shrink-0">
        {(['control', 'setup'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            {t === 'control' ? '🎮 Control' : '⚙️ Setup'}
          </button>
        ))}
      </nav>
    </div>
  );
}
