import { useRoomStore } from '@/entities/room';

/** Меню ігор: список приходить із сервера. Якщо партнер уже зібрав гру, інші тимчасово недоступні. */
export function GameMenu() {
  const view = useRoomStore((state) => state.view);
  const enterGame = useRoomStore((state) => state.enterGame);
  const error = useRoomStore((state) => state.error);

  if (!view) return null;
  const lockedTo = view.partner?.inGame ? view.gameId : null;
  const waitingGame = view.games.find((game) => game.id === lockedTo);

  return (
    <div className="grid w-full max-w-md gap-8">
      <header className="grid gap-2">
        <p className="font-label text-sm tracking-[0.22em] text-brass uppercase">{view.you.name}</p>
        <h1 className="font-display text-5xl font-extrabold italic">Обери гру</h1>
      </header>

      {waitingGame && view.partner && (
        <p className="border-l-4 border-rose bg-wine px-4 py-3">
          {view.partner.name} уже в грі «{waitingGame.title}». Приєднуйся.
        </p>
      )}

      <ul className="grid gap-4">
        {view.games.map((game) => {
          const locked = lockedTo !== null && lockedTo !== game.id;
          return (
            <li
              key={game.id}
              className={`grid gap-3 border-l-4 border-crimson bg-wine p-5 ${locked ? 'opacity-40' : ''}`}
            >
              <h2 className="font-display text-3xl font-extrabold italic">{game.title}</h2>
              <p className="text-bone/70">{game.description}</p>
              <button
                type="button"
                disabled={locked}
                onClick={() => enterGame(game.id)}
                className="w-fit rounded-blade bg-crimson px-6 py-2.5 font-label text-sm font-bold tracking-[0.16em] uppercase transition hover:bg-crimson/80 disabled:cursor-not-allowed"
              >
                {lockedTo === game.id ? 'Приєднатися' : 'Увійти'}
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
