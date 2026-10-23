import { Link } from 'react-router';

const LINK_CLASS = 'rounded-blade px-6 py-3 font-label text-sm font-bold tracking-[0.16em] uppercase transition';

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="font-display text-8xl font-black italic">Tempt</h1>
      <p className="font-label text-lg tracking-[0.16em] uppercase">Лише вдома. Лише вдвох.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/host" className={`${LINK_CLASS} bg-crimson hover:bg-crimson/80`}>
          Підключення
        </Link>
        <Link to="/editor" className={`${LINK_CLASS} border border-bone/60 hover:bg-bone/10`}>
          Редактор
        </Link>
        <Link to="/preview" className={`${LINK_CLASS} border border-bone/60 hover:bg-bone/10`}>
          Превʼю
        </Link>
      </div>
    </main>
  );
}
