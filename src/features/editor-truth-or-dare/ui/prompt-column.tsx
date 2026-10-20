import type { Audience, PromptKind } from '@core/games/truth-or-dare/content.schema';
import { KIND_LABEL } from '../model/labels';
import { usePromptsStore } from '../model/prompts-store';
import { PromptRow } from './prompt-row';

interface PromptColumnProps {
  kind: PromptKind;
  /** Показувати лише записи для цього адресата; null — усі. */
  audienceFilter: Audience | null;
}

export function PromptColumn({ kind, audienceFilter }: PromptColumnProps) {
  const prompts = usePromptsStore((state) => state.prompts);

  const ofKind = prompts.filter((prompt) => prompt.kind === kind);
  const visible = audienceFilter ? ofKind.filter((prompt) => prompt.audience === audienceFilter) : ofKind;

  return (
    <section aria-labelledby={`column-${kind}`} className="grid min-w-0 content-start gap-5">
      <header className="flex items-baseline justify-between border-b border-oxblood pb-2">
        <h2 id={`column-${kind}`} className="font-display text-3xl font-extrabold italic">
          {KIND_LABEL[kind]}
        </h2>
        <span className="font-label text-sm tracking-[0.14em] text-bone/60 uppercase">
          {audienceFilter ? `${visible.length} з ${ofKind.length}` : ofKind.length}
        </span>
      </header>

      {visible.length === 0 ? (
        <p className="text-bone/60">
          {ofKind.length === 0 ? 'Поки порожньо. Додай перший запис угорі.' : 'Для цього фільтра нічого немає.'}
        </p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((prompt) => (
            <PromptRow key={prompt.id} prompt={prompt} />
          ))}
        </ul>
      )}
    </section>
  );
}
