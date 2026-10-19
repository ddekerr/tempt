import { useState } from 'react';
import type { Prompt } from '@core/games/truth-or-dare/content.schema';
import { errorMessage } from '@/shared/api';
import { AUDIENCE_LABEL, AUDIENCE_TEXT_CLASS } from '../model/labels';
import { usePromptsStore } from '../model/prompts-store';
import { PromptForm } from './prompt-form';

const ACTION_BUTTON =
  'font-label text-xs font-semibold tracking-[0.16em] uppercase text-bone/70 hover:text-bone focus-visible:outline-2 focus-visible:outline-rose';

export function PromptRow({ prompt }: { prompt: Prompt }) {
  const update = usePromptsStore((state) => state.update);
  const remove = usePromptsStore((state) => state.remove);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(errorMessage(actionError));
    }
  }

  if (editing) {
    return (
      <li className="border border-crimson bg-wine p-4">
        <PromptForm
          initial={{ text: prompt.text, audience: prompt.audience }}
          submitLabel="Зберегти"
          onSubmit={async (values) => {
            await update(prompt.id, values);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li
      className={`grid gap-3 border-l-4 bg-wine p-4 ${prompt.active ? 'border-crimson' : 'border-oxblood opacity-60'}`}
    >
      <p className="font-display text-lg leading-snug italic">{prompt.text}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className={`rounded-blade border px-2 py-0.5 font-label text-xs tracking-[0.14em] uppercase ${AUDIENCE_TEXT_CLASS[prompt.audience]}`}
        >
          {AUDIENCE_LABEL[prompt.audience]}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={prompt.active}
          onClick={() => run(() => update(prompt.id, { active: !prompt.active }))}
          className={ACTION_BUTTON}
        >
          {prompt.active ? 'Увімкнено' : 'Вимкнено'}
        </button>

        <button type="button" onClick={() => setEditing(true)} className={ACTION_BUTTON}>
          Змінити
        </button>

        {confirmDelete ? (
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => run(() => remove(prompt.id))}
              className="font-label text-xs font-bold tracking-[0.16em] text-rose uppercase"
            >
              Точно видалити
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className={ACTION_BUTTON}>
              Ні
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className={ACTION_BUTTON}>
            Видалити
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose">
          {error}
        </p>
      )}
    </li>
  );
}
