import { STORIES, scriptById } from '@core/games/adventures/stories';
import { adventuresModule } from '@core/games/adventures/module';
import type { AdvCtx } from '@core/games/adventures/types';
import { createRuntime } from '../runtime';
import { adventuresRepository as repo } from './repository';

const ctx: AdvCtx = {
  random: Math.random,
  stories: () => STORIES,
  script: scriptById,
  progress: () => repo.progress(),
  hero: (role) => repo.hero(role),
  treasury: () => repo.treasury(),
  saveHero: (role, hero) => repo.saveHero(role, hero),
  saveProgress: (progress) => repo.saveProgress(progress),
  addTreasure: (item) => repo.addTreasure(item),
  removeTreasure: (id) => repo.removeTreasure(id),
};

export const adventuresRuntime = createRuntime(adventuresModule, ctx);
