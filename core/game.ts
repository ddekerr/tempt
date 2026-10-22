import type { ZodType } from 'zod';
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

export const isGameError = (value: unknown): value is GameError =>
  typeof value === 'object' && value !== null && 'error' in value;

/** Усе, що потрібно грі ззовні: випадковість і доступ до її даних. Кожна гра розширює його сама. */
export interface Ctx {
  random: () => number;
}

/**
 * Модуль гри. Завжди двоє гравців (male / female).
 * `reduce` не залежить від мережі й сокетів: сервер є єдиним джерелом правди про стан,
 * а все зовнішнє (випадковість, записи з бази) приходить через ctx.
 */
export interface GameModule<State, Action, View, C extends Ctx = Ctx> extends GameMeta {
  /** Перевіряє `payload` дії, що прийшов від телефона. */
  actionSchema: ZodType<Action>;
  init: (players: Players, ctx: C) => State;
  reduce: (state: State, action: Action, by: Role, ctx: C) => State | GameError;
  /** Що саме цей гравець має право бачити. */
  viewFor: (state: State, role: Role) => View;
  isOver: (state: State) => boolean;
}
