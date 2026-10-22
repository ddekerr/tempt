import { useState } from 'react';
import type { Scenario, ScenarioInput } from '@core/games/role-play/content.schema';
import { errorMessage } from '@/shared/api';
import { INTENSITY_CLASS, INTENSITY_LABEL } from '@/shared/config/intensity';
import { ScenarioForm } from './scenario-form';

interface ScenarioRowProps {
  scenario: Scenario;
  onUpdate: (id: number, patch: Partial<ScenarioInput>) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}

const ACTION = 'font-label text-xs font-semibold tracking-[0.16em] uppercase text-bone/70 hover:text-bone';

export function ScenarioRow({ scenario, onUpdate, onRemove }: ScenarioRowProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (editing) {
    return (
      <li>
        <ScenarioForm
          scenario={scenario}
          submitLabel="Зберегти"
          onSubmit={async (input) => {
            await onUpdate(scenario.id, input);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li
      className={`grid gap-3 border-l-4 bg-wine p-4 ${scenario.active ? 'border-crimson' : 'border-oxblood opacity-60'}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-xl font-extrabold italic">{scenario.title}</span>
        <span
          className={`rounded-blade border px-2.5 py-1 font-label text-xs font-semibold tracking-[0.14em] uppercase ${INTENSITY_CLASS[scenario.intensity]}`}
        >
          {INTENSITY_LABEL[scenario.intensity]}
        </span>
        {!scenario.active && <span className="text-sm text-bone/60">Приховано</span>}
      </div>
      <p className="text-sm text-bone/70">
        Він: {scenario.male.roleName} · Вона: {scenario.female.roleName}
      </p>
      <div className="flex flex-wrap gap-4">
        <button type="button" className={ACTION} onClick={() => setEditing(true)}>
          Редагувати
        </button>
        <button
          type="button"
          className={ACTION}
          onClick={() => run(() => onUpdate(scenario.id, { active: !scenario.active }))}
        >
          {scenario.active ? 'Сховати' : 'Показати'}
        </button>
        <button
          type="button"
          className={ACTION}
          onClick={() => {
            if (window.confirm(`Видалити «${scenario.title}»?`)) void run(() => onRemove(scenario.id));
          }}
        >
          Видалити
        </button>
      </div>
      {error && (
        <p role="alert" className="text-rose">
          {error}
        </p>
      )}
    </li>
  );
}
