import { Link } from 'react-router';

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="font-display text-8xl font-black italic">Tempt</h1>
      <p className="font-label text-lg tracking-[0.16em] uppercase">Лише вдома. Лише вдвох.</p>
      <Link
        to="/editor"
        className="mt-6 rounded-blade bg-crimson px-6 py-3 font-label text-sm font-bold tracking-[0.16em] uppercase transition hover:bg-crimson/80"
      >
        Редактор
      </Link>
    </main>
  );
}
