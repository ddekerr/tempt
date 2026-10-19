import type { Players, Role } from './roles';

/** Опис гри для меню: сервер віддає його телефонам зі свого реєстру. */
export interface GameMeta {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface GameError {
  error: string;
}

/** Все, що потрібно грі ззовні: випадковість і доступ до її даних. Кожна гра розширює його сама. */
export interface Ctx {
  random: () => number;
}

/**
 * Модуль гри. Завжди двоє гравців (male / female).
 * `reduce` — чиста функція; сервер є єдиним джерелом правди про стан.
 */
export interface GameModule<State, Action, View> extends GameMeta {
  init: (players: Players, ctx: Ctx) => State;
  reduce: (state: State, action: Action, by: Role, ctx: Ctx) => State | GameError;
  /** Що саме цей гравець має право бачити. */
  viewFor: (state: State, role: Role) => View;
  isOver: (state: State) => boolean;
}
