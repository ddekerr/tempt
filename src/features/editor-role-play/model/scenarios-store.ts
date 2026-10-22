import { create } from 'zustand';
import type { Scenario, ScenarioInput } from '@core/games/role-play/content.schema';
import { errorMessage } from '@/shared/api';
import { scenariosApi } from '../api/scenarios-api';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface ScenariosState {
  scenarios: Scenario[];
  status: Status;
  error: string | null;
  load: () => Promise<void>;
  create: (input: ScenarioInput) => Promise<void>;
  update: (id: number, patch: Partial<ScenarioInput>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

/** Помилки create/update/remove кидаємо далі: їх показує компонент, який викликав дію. */
export const useScenariosStore = create<ScenariosState>()((set) => ({
  scenarios: [],
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ scenarios: await scenariosApi.list(), status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: errorMessage(error) });
    }
  },

  create: async (input) => {
    const created = await scenariosApi.create(input);
    set((state) => ({ scenarios: [created, ...state.scenarios] }));
  },

  update: async (id, patch) => {
    const updated = await scenariosApi.update(id, patch);
    set((state) => ({ scenarios: state.scenarios.map((item) => (item.id === id ? updated : item)) }));
  },

  remove: async (id) => {
    await scenariosApi.remove(id);
    set((state) => ({ scenarios: state.scenarios.filter((item) => item.id !== id) }));
  },
}));
