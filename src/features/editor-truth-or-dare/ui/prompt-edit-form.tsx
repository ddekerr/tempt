import { useState, type FormEvent } from 'react';
import { PROMPT_TEXT_MAX, type Audience } from '@core/games/truth-or-dare/content.schema';
import { errorMessage } from '@/shared/api';
import { toAudience, toChoice, type AudienceChoice } from '../model/audience';
import { AudienceToggle } from './audience-toggle';

export interface PromptEditValues {
  text: string;
  audience: Audience;
}

interface PromptEditFormProps {
  initial: PromptEditValues;
  onSubmit: (values: PromptEditValues) => Promise<void>;
  onCancel: () => void;
}

export function PromptEditForm({ initial, onSubmit, onCancel }: PromptEditFormProps) {
  const [text, setText] = useState(initial.text);
  const [choice, setChoice] = useState<AudienceChoice>(toChoice(initial.audience));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = text.trim().length > 0 && !busy;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    try {
      await onSubmit({ text: text.trim(), audience: toAudience(choice) });
    } catch (submitError) {
      setError(errorMessage(submitError));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={PROMPT_TEXT_MAX}
        rows={3}
        aria-label="Текст запису"
        className="w-full resize-y rounded-blade border border-oxblood bg-ink px-3 py-2 text-bone focus:border-rose focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-3">
        <AudienceToggle value={choice} onChange={setChoice} />
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-blade bg-crimson px-5 py-2.5 font-label text-sm font-bold tracking-[0.16em] uppercase transition hover:bg-crimson/80 disabled:opacity-40"
        >
          Зберегти
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-blade border border-bone/60 px-5 py-2.5 font-label text-sm font-bold tracking-[0.16em] uppercase transition hover:bg-bone/10"
        >
          Скасувати
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose">
          {error}
        </p>
      )}
    </form>
  );
}
