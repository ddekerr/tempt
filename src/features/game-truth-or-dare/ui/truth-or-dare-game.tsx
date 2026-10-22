import type { TodView } from '@core/games/truth-or-dare/types';
import { useRoomStore } from '@/entities/room';
import { ChooseKind } from './choose-kind';
import { PromptCard } from './prompt-card';
import { WaitingStub } from './waiting-stub';

/** Екрани «Правди або дії» за тим виглядом, який сервер надіслав саме цьому гравцеві. */
export function TruthOrDareGame() {
  const game = useRoomStore((state) => state.game);
  const sendGameAction = useRoomStore((state) => state.sendGameAction);
  const error = useRoomStore((state) => state.error);

  if (game?.gameId !== 'truth-or-dare') return <p className="text-bone/60">Завантажую…</p>;
  const view = game.view as TodView;

  return (
    <div className="grid gap-6">
      {view.mode === 'choosing' && (
        <>
          <h1 className="font-display text-5xl font-extrabold italic">Твоя черга. Обирай.</h1>
          <ChooseKind onAction={sendGameAction} />
        </>
      )}
      {view.mode === 'showing' && <PromptCard kind={view.kind} text={view.text} onAction={sendGameAction} />}
      {view.mode === 'watching' && <WaitingStub name={view.name} />}

      {error && (
        <p role="alert" className="text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
