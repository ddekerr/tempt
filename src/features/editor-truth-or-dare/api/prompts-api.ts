import type { Prompt, PromptInput } from '@core/games/truth-or-dare/content.schema';
import { http } from '@/shared/api';

const BASE = '/api/games/truth-or-dare/prompts';

export const promptsApi = {
  list: () => http<Prompt[]>(BASE),
  create: (input: PromptInput) => http<Prompt>(BASE, { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, patch: Partial<PromptInput>) =>
    http<Prompt>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: number) => http<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
