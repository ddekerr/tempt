import { useState } from 'react';
import { PROMPT_KINDS, PROMPT_TEXT_MAX, type PromptKind } from '@core/games/truth-or-dare/content.schema';
import { errorMessage } from '@/shared/api';
import { toAudience, type AudienceChoice } from '../model/audience';
import { ADD_LABEL, AUDIENCE_LABEL } from '../model/labels';
import { usePromptsStore } from '../model/prompts-store';
import { AudienceToggle } from './audience-toggle';

const ADD_BUTTON_CLASS: Record<PromptKind, string> = {
  truth: 'bg-crimson hover:bg-crimson/80',
  dare: 'border border-rose bg-oxblood hover:bg-oxblood/70',
};

/** Одне поле для нового запису. Кнопка визначає, куди він піде, а іконки — для кого. */
export function PromptComposer() {
  const create = usePromptsStore((state) => state.create);

  const [text, setText] = useState('');
  const [choice, setChoice] = useState<AudienceChoice>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = text.trim().length > 0 && !busy;
  const audience = toAudience(choice);

  async function add(kind: PromptKind) {
    if (!canAdd) return;
    setBusy(true);
    setError(null);
    try {
      await create({ kind, audience, text: text.trim(), active: true });
      setText('');
    } catch (addError) {
      setError(errorMessage(addError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Новий запис" className="grid gap-4 bg-wine p-5">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={PROMPT_TEXT_MAX}
        rows={3}
        placeholder="Напиши запитання або дію"
        aria-label="Текст нового запису"
        className="w-full resize-y rounded-blade border border-oxblood bg-ink px-3 py-2 text-bone placeholder:text-bone/40 focus:border-rose focus:outline-none"
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AudienceToggle value={choice} onChange={setChoice} />
          <span className="text-sm text-bone/60">{AUDIENCE_LABEL[audience].toLowerCase()}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PROMPT_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              disabled={!canAdd}
              onClick={() => void add(kind)}
              className={`rounded-blade px-5 py-2.5 font-label text-sm font-bold tracking-[0.16em] uppercase transition disabled:opacity-40 ${ADD_BUTTON_CLASS[kind]}`}
            >
              {ADD_LABEL[kind]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose">
          {error}
        </p>
      )}
    </section>
  );
}
