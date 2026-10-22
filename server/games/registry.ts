import { rolePlayRuntime } from './role-play';
import type { GameRuntime } from './runtime';
import { truthOrDareRuntime } from './truth-or-dare';

/** Усі доступні ігри. Нова гра додається одним рядком; меню на телефонах підхопить її само. */
export const RUNTIMES: GameRuntime[] = [truthOrDareRuntime, rolePlayRuntime];
