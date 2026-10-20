import type { GameMeta } from './game';
import { partnerOf, ROLES, type Role } from './roles';

/**
 * Кімната завжди одна й має два слоти: чоловічий і жіночий. Роль визначається адресою (/play/male, /play/female).
 * Усі функції чисті: приймають стан і повертають новий стан або помилку. Сокети, токени й розсилка живуть на сервері.
 */

export interface PlayerState {
  name: string;
  token: string;
  connected: boolean;
  /** Гравець на екрані гри (лоббі або сама гра), а не в меню. */
  inGame: boolean;
  /** Натиснув «Старт» і чекає партнера. */
  ready: boolean;
}

export interface RoomState {
  players: Record<Role, PlayerState | null>;
  /** Гра, яку збирає або грає кімната. null, якщо в грі нікого немає. */
  gameId: string | null;
  /** Обоє підключені, у грі й натиснули «Старт». */
  playing: boolean;
}

export interface RoomError {
  error: string;
}

export const isRoomError = (value: unknown): value is RoomError =>
  typeof value === 'object' && value !== null && 'error' in value;

export const createRoom = (): RoomState => ({ players: { male: null, female: null }, gameId: null, playing: false });

function withPlayer(state: RoomState, role: Role, patch: Partial<PlayerState>): RoomState {
  const player = state.players[role];
  if (!player) return state;
  return { ...state, players: { ...state.players, [role]: { ...player, ...patch } } };
}

/** Наводить порядок після будь-якої зміни: гра закривається без людей у ній і йде лише коли обоє готові. */
function settle(state: RoomState): RoomState {
  const anyoneInGame = ROLES.some((role) => state.players[role]?.inGame);
  if (!anyoneInGame) return { ...state, gameId: null, playing: false };

  const bothReady = ROLES.every((role) => {
    const player = state.players[role];
    return Boolean(player?.connected && player.inGame && player.ready);
  });
  return { ...state, playing: bothReady };
}

export function joinRoom(
  state: RoomState,
  role: Role,
  name: string,
  token: string | undefined,
  makeToken: () => string,
): { state: RoomState; token: string } | RoomError {
  const existing = state.players[role];

  if (!existing) {
    const newToken = makeToken();
    const player: PlayerState = { name, token: newToken, connected: true, inGame: false, ready: false };
    return { state: { ...state, players: { ...state.players, [role]: player } }, token: newToken };
  }

  if (token && token === existing.token) {
    return { state: withPlayer(state, role, { name, connected: true }), token: existing.token };
  }

  return { error: 'Ця роль уже зайнята' };
}

export function disconnect(state: RoomState, role: Role): RoomState {
  const next = withPlayer(state, role, { connected: false, ready: false });
  return settle(withPlayer(next, partnerOf(role), { ready: false }));
}

export function enterGame(state: RoomState, role: Role, gameId: string): RoomState | RoomError {
  if (!state.players[role]) return { error: 'Спочатку увійди' };
  if (state.playing) return { error: 'Гра вже йде' };
  if (state.gameId && state.gameId !== gameId) return { error: 'Партнер уже зібрав іншу гру' };

  return settle({ ...withPlayer(state, role, { inGame: true, ready: false }), gameId });
}

export function leaveGame(state: RoomState, role: Role): RoomState | RoomError {
  if (!state.players[role]) return { error: 'Спочатку увійди' };

  const next = withPlayer(state, role, { inGame: false, ready: false });
  return settle(withPlayer(next, partnerOf(role), { ready: false }));
}

export function setReady(state: RoomState, role: Role, ready: boolean): RoomState | RoomError {
  const player = state.players[role];
  if (!player?.inGame) return { error: 'Спершу зайди в гру' };
  if (state.playing) return { error: 'Гра вже йде' };

  return settle(withPlayer(state, role, { ready }));
}

/** Звільняє слот (кнопка «Скинути» на комп'ютері). */
export function resetSlot(state: RoomState, role: Role): RoomState {
  const next = withPlayer(state, partnerOf(role), { ready: false });
  return settle({ ...next, players: { ...next.players, [role]: null } });
}

/** Що клієнт бачить про партнера. Сирих налаштувань тут немає, лише стан підключення. */
export interface PartnerView {
  name: string;
  connected: boolean;
  inGame: boolean;
  ready: boolean;
}

export interface RoomView {
  role: Role;
  you: { name: string; inGame: boolean; ready: boolean };
  partner: PartnerView | null;
  gameId: string | null;
  playing: boolean;
  games: GameMeta[];
}

export function viewOfRoom(state: RoomState, role: Role, games: GameMeta[]): RoomView | undefined {
  const you = state.players[role];
  if (!you) return undefined;

  const partner = state.players[partnerOf(role)];
  return {
    role,
    you: { name: you.name, inGame: you.inGame, ready: you.ready },
    partner: partner
      ? { name: partner.name, connected: partner.connected, inGame: partner.inGame, ready: partner.ready }
      : null,
    gameId: state.gameId,
    playing: state.playing,
    games,
  };
}

/** Що бачить сторінка /host про кожен слот. */
export type SlotStatus = { name: string; connected: boolean; inGame: boolean } | null;

export function slotStatuses(state: RoomState): Record<Role, SlotStatus> {
  const status = (role: Role): SlotStatus => {
    const player = state.players[role];
    return player ? { name: player.name, connected: player.connected, inGame: player.inGame } : null;
  };
  return { male: status('male'), female: status('female') };
}
