import { rolePlayModule } from '@core/games/role-play/module';
import type { RpCtx } from '@core/games/role-play/types';
import { createRuntime } from '../runtime';
import { scenariosRepository } from './repository';

const ctx: RpCtx = {
  random: Math.random,
  catalog: () => scenariosRepository.catalog(),
  scenario: (id) => scenariosRepository.getActive(id),
};

export const rolePlayRuntime = createRuntime(rolePlayModule, ctx);
