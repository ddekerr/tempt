import type { Scenario, ScenarioInput } from '@core/games/role-play/content.schema';
import { http } from '@/shared/api';

const BASE = '/api/games/role-play/scenarios';

export const scenariosApi = {
  list: () => http<Scenario[]>(BASE),
  create: (input: ScenarioInput) => http<Scenario>(BASE, { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, patch: Partial<ScenarioInput>) =>
    http<Scenario>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: number) => http<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
