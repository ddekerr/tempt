import { useEffect, useState } from 'react';
import { AUDIENCES, PROMPT_KINDS, type Audience } from '@core/games/truth-or-dare/content.schema';
import { AUDIENCE_LABEL } from '../model/labels';
import { usePromptsStore } from '../model/prompts-store';
import { PromptColumn } from './prompt-column';

export function TruthOrDareEditor() {
  const status = usePromptsStore((state) => state.status);
  const error = usePromptsStore((state) => state.error);
  const load = usePromptsStore((state) => state.load);

  const [audienceFilter, setAudienceFilter] = useState<Audience | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'idle' || status === 'loading') return <p className="text-bone/60">Завантажую…</p>;

  if (status === 'error') {
    return (
      <div role="alert" className="grid gap-3">
        <p className="text-rose">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="w-fit rounded-blade bg-crimson px-5 py-2 font-label text-sm font-bold tracking-[0.16em] uppercase"
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Фільтр за адресатом">
        <span className="mr-2 font-label text-sm tracking-[0.14em] text-bone/60 uppercase">Показати</span>
        {[null, ...AUDIENCES].map((value) => (
          <button
            key={value ?? 'all'}
            type="button"
            aria-pressed={audienceFilter === value}
            onClick={() => setAudienceFilter(value)}
            className="rounded-blade border border-oxblood px-3 py-1.5 font-label text-sm tracking-[0.12em] uppercase aria-pressed:border-crimson aria-pressed:bg-crimson"
          >
            {value ? AUDIENCE_LABEL[value] : 'Усі'}
          </button>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {PROMPT_KINDS.map((kind) => (
          <PromptColumn key={kind} kind={kind} audienceFilter={audienceFilter} />
        ))}
      </div>
    </div>
  );
}
