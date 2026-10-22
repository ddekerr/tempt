import { isGameError, type Ctx, type GameError, type GameMeta, type GameModule } from '@core/game';
import type { Players, Role } from '@core/roles';

/**
 * Серверна обгортка над модулем гри: прибирає типи стану й дії, щоб RoomManager міг працювати
 * з будь-якою грою однаково. Нетипізований `payload` від телефона перевіряє схема самої гри.
 */
export interface GameRuntime {
  meta: GameMeta;
  init: (players: Players) => unknown;
  act: (state: unknown, payload: unknown, by: Role) => { state: unknown } | GameError;
  viewFor: (state: unknown, role: Role) => unknown;
}

export function createRuntime<State, Action, View, C extends Ctx>(
  module: GameModule<State, Action, View, C>,
  ctx: C,
): GameRuntime {
  const { id, title, description, icon } = module;

  return {
    meta: { id, title, description, icon },
    init: (players) => module.init(players, ctx),
    act: (state, payload, by) => {
      const action = module.actionSchema.safeParse(payload);
      if (!action.success) return { error: 'Некоректна дія' };

      const next = module.reduce(state as State, action.data, by, ctx);
      return isGameError(next) ? next : { state: next };
    },
    viewFor: (state, role) => module.viewFor(state as State, role),
  };
}
