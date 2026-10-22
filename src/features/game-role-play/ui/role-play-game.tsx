import type { RpView } from '@core/games/role-play/types';
import { useRoomStore } from '@/entities/room';
import { RoleReveal } from './role-reveal';
import { ScenarioList } from './scenario-list';

/** Екрани «Рольових ігор» за тим виглядом, який сервер надіслав саме цьому гравцеві. */
export function RolePlayGame() {
  const game = useRoomStore((state) => state.game);
  const role = useRoomStore((state) => state.role);
  const sendGameAction = useRoomStore((state) => state.sendGameAction);
  const error = useRoomStore((state) => state.error);

  if (game?.gameId !== 'role-play' || !role) return <p className="text-bone/60">Завантажую…</p>;
  const view = game.view as RpView;

  return (
    <div className="grid gap-6">
      {view.mode === 'choosing' && <ScenarioList catalog={view.catalog} onAction={sendGameAction} />}
      {/* key: у кожного нового сценарію роль знову закрита */}
      {view.mode === 'playing' && (
        <RoleReveal key={view.scenarioId} view={view} role={role} onAction={sendGameAction} />
      )}

      {error && (
        <p role="alert" className="text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
