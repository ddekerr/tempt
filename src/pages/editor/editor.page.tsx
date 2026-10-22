import { useState } from 'react';
import { Link } from 'react-router';
import { RolePlayEditor } from '@/features/editor-role-play';
import { TruthOrDareEditor } from '@/features/editor-truth-or-dare';

const GAMES = [
  { id: 'truth-or-dare', title: 'Правда або дія' },
  { id: 'role-play', title: 'Рольові ігри' },
] as const;

type EditorGameId = (typeof GAMES)[number]['id'];

export function EditorPage() {
  const [gameId, setGameId] = useState<EditorGameId>('truth-or-dare');

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/" className="font-label text-sm tracking-[0.22em] text-brass uppercase hover:text-rose">
        ← Tempt
      </Link>
      <p className="mt-6 font-label text-sm tracking-[0.22em] text-brass uppercase">Редактор</p>
      <div role="tablist" aria-label="Гра" className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
        {GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            role="tab"
            aria-selected={gameId === game.id}
            onClick={() => setGameId(game.id)}
            className="border-b-4 border-transparent font-display text-4xl font-extrabold text-bone/40 italic transition hover:text-bone/70 aria-selected:border-crimson aria-selected:text-bone sm:text-5xl"
          >
            {game.title}
          </button>
        ))}
      </div>
      <div className="mt-10">
        {gameId === 'truth-or-dare' && <TruthOrDareEditor />}
        {gameId === 'role-play' && <RolePlayEditor />}
      </div>
    </main>
  );
}
