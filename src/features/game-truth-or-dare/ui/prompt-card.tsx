import type { PromptKind } from '@core/games/truth-or-dare/content.schema';
import type { TodAction } from '@core/games/truth-or-dare/types';

const KIND_LABEL: Record<PromptKind, string> = {
  truth: 'Правда',
  dare: 'Дія',
};

interface PromptCardProps {
  kind: PromptKind;
  text: string;
  onAction: (action: TodAction) => void;
}

/** Запис для гравця, чия черга: «Оновити» замінює його, «Готово» передає хід партнеру. */
export function PromptCard({ kind, text, onAction }: PromptCardProps) {
  return (
    <div className="grid gap-5">
      <article className="grid gap-4 border-l-4 border-crimson bg-wine p-6">
        <p className="font-label text-sm tracking-[0.2em] text-brass uppercase">{KIND_LABEL[kind]}</p>
        <p className="font-display text-3xl leading-snug font-medium italic">{text}</p>
      </article>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAction({ type: 'reroll' })}
          className="rounded-blade border border-bone/60 px-4 py-3 font-label text-base font-bold tracking-[0.16em] uppercase transition hover:bg-bone/10"
        >
          Оновити
        </button>
        <button
          type="button"
          onClick={() => onAction({ type: 'done' })}
          className="rounded-blade bg-crimson px-4 py-3 font-label text-base font-bold tracking-[0.16em] uppercase transition hover:bg-crimson/80"
        >
          Готово
        </button>
      </div>
    </div>
  );
}
