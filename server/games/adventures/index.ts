import { STORIES } from '@core/games/adventures/stories';
import { adventuresModule } from '@core/games/adventures/module';
import type { AdvCtx } from '@core/games/adventures/types';
import { createRuntime } from '../runtime';
import { adventuresRepository } from './repository';

const ctx: AdvCtx = {
  random: Math.random,
  stories: () => STORIES,
  progress: () => adventuresRepository.progress(),
  hero: (role) => adventuresRepository.hero(role),
  treasury: () => adventuresRepository.treasury(),
};

export const adventuresRuntime = createRuntime(adventuresModule, ctx);
