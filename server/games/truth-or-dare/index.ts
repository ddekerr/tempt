import { truthOrDareModule } from '@core/games/truth-or-dare/module';
import type { TodCtx } from '@core/games/truth-or-dare/types';
import { createRuntime } from '../runtime';
import { historyRepository, promptsRepository } from './repository';

const ctx: TodCtx = {
  random: Math.random,
  pool: (kind, role) => promptsRepository.activeFor(kind, role),
  history: {
    doneIds: () => historyRepository.doneIds(),
    record: (promptId) => historyRepository.record(promptId),
    clear: (promptIds) => historyRepository.clear(promptIds),
  },
};

export const truthOrDareRuntime = createRuntime(truthOrDareModule, ctx);
