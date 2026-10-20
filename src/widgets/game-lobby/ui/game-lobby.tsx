import { useRoomStore } from '@/entities/room';

/** Екран перед стартом: статус партнера, «Старт» і «Скасувати». Гра починається, коли натиснули обоє. */
export function GameLobby() {
  const view = useRoomStore((state) => state.view);
  const setReady = useRoomStore((state) => state.setReady);
  const leaveGame = useRoomStore((state) => state.leaveGame);
  const error = useRoomStore((state) => state.error);

  if (!view) return null;
  const game = view.games.find((item) => item.id === view.gameId);
  const partner = view.partner;

  let partnerStatus = 'Партнер ще не підключився';
  if (partner) {
    if (!partner.connected) partnerStatus = `${partner.name} відключився`;
    else if (!partner.inGame) partnerStatus = `${partner.name} у меню`;
    else if (partner.ready) partnerStatus = `${partner.name} натиснув «Старт»`;
    else partnerStatus = `${partner.name} уже в грі`;
  }

  return (
    <div className="grid w-full max-w-md gap-8">
      <header className="grid gap-2">
        <p className="font-label text-sm tracking-[0.22em] text-brass uppercase">{view.you.name}</p>
        <h1 className="font-display text-5xl font-extrabold italic">{game?.title ?? 'Гра'}</h1>
      </header>

      <p className="border-l-4 border-rose bg-wine px-4 py-3">{partnerStatus}</p>

      {view.you.ready ? (
        <div className="grid gap-3">
          <p className="font-display text-2xl italic">Чекаємо на {partner?.name ?? 'партнера'}…</p>
          <button
            type="button"
            onClick={() => setReady(false)}
            className="rounded-blade border border-bone/60 px-6 py-3 font-label text-lg font-bold tracking-[0.16em] uppercase transition hover:bg-bone/10"
          >
            Скасувати
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setReady(true)}
          className="rounded-blade bg-crimson px-6 py-3 font-label text-lg font-bold tracking-[0.16em] uppercase transition hover:bg-crimson/80"
        >
          Старт
        </button>
      )}

      <button
        type="button"
        onClick={leaveGame}
        className="w-fit font-label text-sm tracking-[0.16em] text-bone/70 uppercase hover:text-bone"
      >
        ← В меню
      </button>

      {error && (
        <p role="alert" className="text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
