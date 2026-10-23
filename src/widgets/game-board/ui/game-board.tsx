import { useRoomStore } from '@/entities/room';
import { AdventuresGame } from '@/features/game-adventures';
import { RolePlayGame } from '@/features/game-role-play';
import { TruthOrDareGame } from '@/features/game-truth-or-dare';

/** За id гри підставляє екран потрібної гри. Нова гра додає сюди один рядок. */
function Game({ gameId }: { gameId: string | null }) {
  switch (gameId) {
    case 'truth-or-dare':
      return <TruthOrDareGame />;
    case 'role-play':
      return <RolePlayGame />;
    case 'adventures':
      return <AdventuresGame />;
    default:
      return <p className="text-bone/60">Невідома гра.</p>;
  }
}

export function GameBoard() {
  const view = useRoomStore((state) => state.view);
  const leaveGame = useRoomStore((state) => state.leaveGame);

  if (!view) return null;

  return (
    <div className="grid w-full max-w-md gap-8">
      <Game gameId={view.gameId} />
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
