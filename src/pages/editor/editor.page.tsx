import { Link } from 'react-router';
import { TruthOrDareEditor } from '@/features/editor-truth-or-dare';

export function EditorPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/" className="font-label text-sm tracking-[0.22em] text-brass uppercase hover:text-rose">
        ← Tempt
      </Link>
      <p className="mt-6 font-label text-sm tracking-[0.22em] text-brass uppercase">Редактор</p>
      <h1 className="font-display text-5xl font-extrabold italic sm:text-6xl">Правда або дія</h1>
      <div className="mt-10">
        <TruthOrDareEditor />
      </div>
    </main>
  );
}
