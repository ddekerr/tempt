import { useState } from 'react';
import { INTENSITIES, type Intensity, type ScenarioSummary } from '@core/games/role-play/content.schema';
import type { RpAction } from '@core/games/role-play/types';
import { INTENSITY_CLASS, INTENSITY_LABEL } from '@/shared/config/intensity';

interface ScenarioListProps {
  catalog: ScenarioSummary[];
  onAction: (action: RpAction) => void;
}

const CHIP = 'rounded-blade border px-3 py-1.5 font-label text-xs font-semibold tracking-[0.14em] uppercase transition';

/** Список сценаріїв із фільтром за рівнем. Обрати може будь-хто з вас, сценарій відкриється обом. */
export function ScenarioList({ catalog, onAction }: ScenarioListProps) {
  const [filter, setFilter] = useState<Intensity | null>(null);

  const visible = filter ? catalog.filter((item) => item.intensity === filter) : catalog;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="font-display text-5xl font-extrabold italic">Обери сценарій</h1>
        <p className="text-bone/60">
          {visible.length} з {catalog.length}
        </p>
      </header>

      <div role="group" aria-label="Рівень" className="flex flex-wrap gap-2">
        {[null, ...INTENSITIES].map((value) => (
          <button
            key={value ?? 'all'}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`${CHIP} border-oxblood aria-pressed:border-crimson aria-pressed:bg-crimson`}
          >
            {value ? INTENSITY_LABEL[value] : 'Усі'}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAction({ type: 'random', intensity: filter })}
        className="flex items-center justify-between rounded-blade bg-crimson px-5 py-4 text-left font-label text-xl font-bold tracking-[0.16em] uppercase transition hover:translate-x-1 hover:bg-crimson/80"
      >
        Мені пощастить
        <span aria-hidden="true">⟲</span>
      </button>

      {catalog.length === 0 ? (
        <p className="text-bone/60">Сценаріїв ще немає. Додай їх у редакторі на комп'ютері.</p>
      ) : visible.length === 0 ? (
        <p className="text-bone/60">Для цього рівня сценаріїв немає.</p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onAction({ type: 'pick', scenarioId: item.id })}
                className="grid w-full gap-3 border-l-4 border-crimson bg-wine p-4 text-left transition hover:translate-x-1 hover:bg-wine/70"
              >
                <span className="font-display text-2xl leading-snug font-extrabold italic">{item.title}</span>
                <span className={`w-fit ${CHIP} ${INTENSITY_CLASS[item.intensity]}`}>
                  {INTENSITY_LABEL[item.intensity]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
