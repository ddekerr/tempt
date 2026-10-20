import { useRoomStore } from '@/entities/room';

/** Тут за id гри підставлятиметься екран самої гри. Поки ігор немає, показуємо заглушку. */
export function GameBoard() {
  const view = useRoomStore((state) => state.view);
  const leaveGame = useRoomStore((state) => state.leaveGame);

  if (!view) return null;
  const game = view.games.find((item) => item.id === view.gameId);

  return (
    <div className="grid w-full max-w-md gap-6">
      <p className="font-label text-sm tracking-[0.22em] text-brass uppercase">{game?.title}</p>
      <h1 className="font-display text-5xl font-extrabold italic">Починаємо</h1>
      <p className="text-bone/70">Обоє натиснули «Старт». Сама гра з'явиться тут.</p>
      <button
        type="button"
        onClick={leaveGame}
        className="w-fit font-label text-sm tracking-[0.16em] text-bone/70 uppercase hover:text-bone"
      >
        ← В меню
      </button>
    </div>
  );
}
