import { useId, useState, type FormEvent } from 'react';
import { AUDIENCES, PROMPT_TEXT_MAX, type Audience } from '@core/games/truth-or-dare/content.schema';
import { errorMessage } from '@/shared/api';
import { AUDIENCE_LABEL } from '../model/labels';

export interface PromptFormValues {
  text: string;
  audience: Audience;
}

interface PromptFormProps {
  initial?: PromptFormValues;
  submitLabel: string;
  /** Очистити поле після успішного збереження (для додавання нового запису). */
  resetOnSuccess?: boolean;
  onSubmit: (values: PromptFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function PromptForm({ initial, submitLabel, resetOnSuccess, onSubmit, onCancel }: PromptFormProps) {
  const groupName = useId();
  const [text, setText] = useState(initial?.text ?? '');
  const [audience, setAudience] = useState<Audience>(initial?.audience ?? 'both');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = text.trim().length > 0 && !busy;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    try {
      await onSubmit({ text: text.trim(), audience });
      if (resetOnSuccess) setText('');
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
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
        placeholder="Текст запису"
        aria-label="Текст запису"
        className="w-full resize-y rounded-blade border border-oxblood bg-ink px-3 py-2 text-bone placeholder:text-bone/40 focus:border-rose focus:outline-none"
      />

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Для кого запис</legend>
        {AUDIENCES.map((value) => (
          <label
            key={value}
            className="cursor-pointer rounded-blade border border-oxblood px-3 py-1.5 font-label text-sm tracking-[0.12em] uppercase has-checked:border-crimson has-checked:bg-crimson has-focus-visible:outline-2 has-focus-visible:outline-rose"
          >
            <input
              type="radio"
              name={groupName}
              value={value}
              checked={audience === value}
              onChange={() => setAudience(value)}
              className="sr-only"
            />
            {AUDIENCE_LABEL[value]}
          </label>
        ))}
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-blade bg-crimson px-5 py-2 font-label text-sm font-bold tracking-[0.16em] uppercase transition hover:bg-crimson/80 disabled:opacity-40"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-blade border border-bone/60 px-5 py-2 font-label text-sm font-bold tracking-[0.16em] uppercase transition hover:bg-bone/10"
          >
            Скасувати
          </button>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
