import { create } from 'zustand';
import type { Prompt, PromptInput } from '@core/games/truth-or-dare/content.schema';
import { errorMessage } from '@/shared/api';
import { promptsApi } from '../api/prompts-api';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface PromptsState {
  prompts: Prompt[];
  status: Status;
  error: string | null;
  load: () => Promise<void>;
  create: (input: PromptInput) => Promise<void>;
  update: (id: number, patch: Partial<PromptInput>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

/** Помилки create/update/remove кидаємо далі: їх показує компонент, який викликав дію. */
export const usePromptsStore = create<PromptsState>()((set) => ({
  prompts: [],
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ prompts: await promptsApi.list(), status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: errorMessage(error) });
    }
  },

  create: async (input) => {
    const created = await promptsApi.create(input);
    set((state) => ({ prompts: [created, ...state.prompts] }));
  },

  update: async (id, patch) => {
    const updated = await promptsApi.update(id, patch);
    set((state) => ({ prompts: state.prompts.map((prompt) => (prompt.id === id ? updated : prompt)) }));
  },

  remove: async (id) => {
    await promptsApi.remove(id);
    set((state) => ({ prompts: state.prompts.filter((prompt) => prompt.id !== id) }));
  },
}));
