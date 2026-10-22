import { useState } from 'react';
import {
  INTENSITIES,
  type Intensity,
  type RoleCard,
  type Scenario,
  type ScenarioInput,
} from '@core/games/role-play/content.schema';
import type { Role } from '@core/roles';
import { errorMessage } from '@/shared/api';
import { INTENSITY_LABEL } from '@/shared/config/intensity';

/** Форма працює з рядками: фрази — по одній на рядок. У ScenarioInput вони стають масивом. */
interface RoleDraft {
  roleName: string;
  description: string;
  howToStart: string;
  phrases: string;
  outfit: string;
  guide: string;
}

interface Draft {
  title: string;
  intensity: Intensity;
  active: boolean;
  male: RoleDraft;
  female: RoleDraft;
}

const EMPTY_ROLE: RoleDraft = { roleName: '', description: '', howToStart: '', phrases: '', outfit: '', guide: '' };

const toRoleDraft = (card: RoleCard): RoleDraft => ({ ...card, phrases: card.phrases.join('\n') });

const toRoleCard = (draft: RoleDraft): RoleCard => ({
  ...draft,
  phrases: draft.phrases
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
});

function toDraft(scenario?: Scenario): Draft {
  if (!scenario) {
    return { title: '', intensity: 'gentle', active: true, male: EMPTY_ROLE, female: EMPTY_ROLE };
  }
  return {
    title: scenario.title,
    intensity: scenario.intensity,
    active: scenario.active,
    male: toRoleDraft(scenario.male),
    female: toRoleDraft(scenario.female),
  };
}

const FIELD =
  'w-full rounded-blade border border-oxblood bg-ink px-3 py-2 text-bone placeholder:text-bone/40 focus:border-crimson focus:outline-none';
const LABEL = 'grid gap-1.5 font-label text-xs font-semibold tracking-[0.18em] text-brass uppercase';
const CHIP = 'rounded-blade border px-3 py-1.5 font-label text-xs font-semibold tracking-[0.14em] uppercase transition';

const ROLE_TAB: Record<Role, string> = { male: 'Для нього', female: 'Для неї' };

interface ScenarioFormProps {
  scenario?: Scenario;
  submitLabel: string;
  onSubmit: (input: ScenarioInput) => Promise<void>;
  onCancel?: () => void;
}

export function ScenarioForm({ scenario, submitLabel, onSubmit, onCancel }: ScenarioFormProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(scenario));
  const [tab, setTab] = useState<Role>('male');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const role = draft[tab];
  const setRoleField = (field: keyof RoleDraft, value: string) =>
    setDraft((current) => ({ ...current, [tab]: { ...current[tab], [field]: value } }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title: draft.title,
        intensity: draft.intensity,
        active: draft.active,
        male: toRoleCard(draft.male),
        female: toRoleCard(draft.female),
      });
      if (!scenario) {
        setDraft(toDraft());
        setTab('male');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 border-l-4 border-crimson bg-wine p-5">
      <label className={LABEL}>
        Назва сценарію
        <input
          className={FIELD}
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="Напр. Незнайомці в барі"
        />
      </label>

      <div className="grid gap-1.5">
        <span className={LABEL}>Рівень</span>
        <div role="group" aria-label="Рівень" className="flex flex-wrap gap-2">
          {INTENSITIES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={draft.intensity === value}
              onClick={() => setDraft({ ...draft, intensity: value })}
              className={`${CHIP} border-oxblood aria-pressed:border-crimson aria-pressed:bg-crimson`}
            >
              {INTENSITY_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      <div role="tablist" aria-label="Роль" className="flex gap-2">
        {(['male', 'female'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`${CHIP} border-oxblood aria-selected:border-crimson aria-selected:bg-crimson`}
          >
            {ROLE_TAB[value]}
          </button>
        ))}
      </div>

      <div className="grid gap-4" role="tabpanel">
        <label className={LABEL}>
          Назва ролі
          <input
            className={FIELD}
            value={role.roleName}
            onChange={(event) => setRoleField('roleName', event.target.value)}
            placeholder="Напр. Таємничий незнайомець"
          />
        </label>
        <label className={LABEL}>
          Опис
          <textarea
            className={FIELD}
            rows={4}
            value={role.description}
            onChange={(event) => setRoleField('description', event.target.value)}
          />
        </label>
        <label className={LABEL}>
          Як почати
          <textarea
            className={FIELD}
            rows={3}
            value={role.howToStart}
            onChange={(event) => setRoleField('howToStart', event.target.value)}
          />
        </label>
        <label className={LABEL}>
          Приклади фраз (по одній на рядок)
          <textarea
            className={FIELD}
            rows={4}
            value={role.phrases}
            onChange={(event) => setRoleField('phrases', event.target.value)}
          />
        </label>
        <label className={LABEL}>
          Екіпірування (за бажанням)
          <textarea
            className={FIELD}
            rows={2}
            value={role.outfit}
            onChange={(event) => setRoleField('outfit', event.target.value)}
          />
        </label>
        <label className={LABEL}>
          Твоя роль
          <textarea
            className={FIELD}
            rows={3}
            value={role.guide}
            onChange={(event) => setRoleField('guide', event.target.value)}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
        />
        Показувати в грі
      </label>

      {error && (
        <p role="alert" className="text-rose">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-blade bg-crimson px-5 py-2.5 font-label text-sm font-bold tracking-[0.16em] uppercase transition hover:bg-crimson/80 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-blade border border-bone/60 px-5 py-2.5 font-label text-sm font-bold tracking-[0.16em] uppercase hover:bg-bone/10"
          >
            Скасувати
          </button>
        )}
      </div>
    </form>
  );
}
