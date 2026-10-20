import type { GameMeta } from '@core/game';
import { TRUTH_OR_DARE_META } from '@core/games/truth-or-dare/meta';

/** Усі доступні ігри. Нова гра додається одним рядком; меню на телефонах підхопить її само. */
export const GAMES: GameMeta[] = [TRUTH_OR_DARE_META];
