import { useEffect } from 'react';
import { useScenariosStore } from '../model/scenarios-store';
import { ScenarioForm } from './scenario-form';
import { ScenarioRow } from './scenario-row';

export function RolePlayEditor() {
  const { scenarios, status, error, load, create, update, remove } = useScenariosStore();

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="grid content-start gap-4">
        <h2 className="font-label text-sm tracking-[0.22em] text-brass uppercase">Новий сценарій</h2>
        <ScenarioForm submitLabel="Додати сценарій" onSubmit={create} />
      </section>

      <section className="grid content-start gap-4">
        <h2 className="font-label text-sm tracking-[0.22em] text-brass uppercase">Сценарії · {scenarios.length}</h2>
        {status === 'loading' && <p className="text-bone/60">Завантажую…</p>}
        {status === 'error' && (
          <p role="alert" className="text-rose">
            {error}
          </p>
        )}
        {status === 'ready' && scenarios.length === 0 && <p className="text-bone/60">Поки порожньо.</p>}
        <ul className="grid gap-3">
          {scenarios.map((scenario) => (
            <ScenarioRow key={scenario.id} scenario={scenario} onUpdate={update} onRemove={remove} />
          ))}
        </ul>
      </section>
    </div>
  );
}
