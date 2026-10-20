import { describe, expect, it } from 'vitest';
import {
  createRoom,
  disconnect,
  enterGame,
  isRoomError,
  joinRoom,
  leaveGame,
  resetSlot,
  setReady,
  type RoomState,
} from './room';

let counter = 0;
const makeToken = () => `token-${++counter}`;

function joined(state: RoomState, role: 'male' | 'female', name: string): { state: RoomState; token: string } {
  const result = joinRoom(state, role, name, undefined, makeToken);
  if (isRoomError(result)) throw new Error(result.error);
  return result;
}

function ok(result: RoomState | { error: string }): RoomState {
  if (isRoomError(result)) throw new Error(result.error);
  return result;
}

/** Обоє підключені й обоє зайшли в гру. */
function bothInGame() {
  const a = joined(createRoom(), 'male', 'Дмитро');
  const b = joined(a.state, 'female', 'Аня');
  let state = ok(enterGame(b.state, 'male', 'truth-or-dare'));
  state = ok(enterGame(state, 'female', 'truth-or-dare'));
  return { state, maleToken: a.token, femaleToken: b.token };
}

describe('joinRoom', () => {
  it('займає вільний слот і видає токен', () => {
    const { state, token } = joined(createRoom(), 'male', 'Дмитро');
    expect(state.players.male).toMatchObject({ name: 'Дмитро', token, connected: true, inGame: false, ready: false });
  });

  it('відмовляє другому пристрою без токена, поки слот зайнятий', () => {
    const { state } = joined(createRoom(), 'male', 'Дмитро');
    expect(joinRoom(state, 'male', 'Хтось', undefined, makeToken)).toEqual({ error: 'Ця роль уже зайнята' });
  });

  it('повертає той самий пристрій у слот за токеном і оновлює ім’я', () => {
    const first = joined(createRoom(), 'male', 'Дмитро');
    const dropped = disconnect(first.state, 'male');
    const result = joinRoom(dropped, 'male', 'Діма', first.token, makeToken);
    if (isRoomError(result)) throw new Error(result.error);
    expect(result.token).toBe(first.token);
    expect(result.state.players.male).toMatchObject({ name: 'Діма', connected: true });
  });
});

describe('вхід у гру', () => {
  it('перший, хто зайшов, задає гру кімнати', () => {
    const { state } = joined(createRoom(), 'male', 'Дмитро');
    const next = ok(enterGame(state, 'male', 'truth-or-dare'));
    expect(next.gameId).toBe('truth-or-dare');
    expect(next.players.male?.inGame).toBe(true);
  });

  it('не пускає партнера в іншу гру, поки перший у цій', () => {
    const { state } = joined(joined(createRoom(), 'male', 'Дмитро').state, 'female', 'Аня');
    const inGame = ok(enterGame(state, 'male', 'truth-or-dare'));
    expect(enterGame(inGame, 'female', 'monopoly')).toEqual({ error: 'Партнер уже зібрав іншу гру' });
  });

  it('закриває гру, коли єдиний гравець виходить у меню', () => {
    const { state } = joined(createRoom(), 'male', 'Дмитро');
    const left = ok(leaveGame(ok(enterGame(state, 'male', 'truth-or-dare')), 'male'));
    expect(left.gameId).toBeNull();
  });
});

describe('старт гри', () => {
  it('гра йде лише коли обоє натиснули «Старт»', () => {
    const { state } = bothInGame();
    const oneReady = ok(setReady(state, 'male', true));
    expect(oneReady.playing).toBe(false);

    const bothReady = ok(setReady(oneReady, 'female', true));
    expect(bothReady.playing).toBe(true);
  });

  it('«Скасувати» знімає готовність', () => {
    const { state } = bothInGame();
    const cancelled = ok(setReady(ok(setReady(state, 'male', true)), 'male', false));
    expect(cancelled.players.male?.ready).toBe(false);
  });

  it('не дає натиснути «Старт» з меню', () => {
    const { state } = joined(createRoom(), 'male', 'Дмитро');
    expect(setReady(state, 'male', true)).toEqual({ error: 'Спершу зайди в гру' });
  });

  it('вихід партнера під час гри повертає того, хто лишився, у лоббі з порожньою готовністю', () => {
    const { state } = bothInGame();
    const playing = ok(setReady(ok(setReady(state, 'male', true)), 'female', true));
    const left = ok(leaveGame(playing, 'female'));
    expect(left.playing).toBe(false);
    expect(left.players.male).toMatchObject({ inGame: true, ready: false });
    expect(left.gameId).toBe('truth-or-dare');
  });

  it('відключення телефона зупиняє гру, але лишає його в тій самій грі', () => {
    const { state } = bothInGame();
    const playing = ok(setReady(ok(setReady(state, 'male', true)), 'female', true));
    const dropped = disconnect(playing, 'female');
    expect(dropped.playing).toBe(false);
    expect(dropped.players.female).toMatchObject({ connected: false, inGame: true, ready: false });
  });
});

describe('resetSlot', () => {
  it('звільняє слот і скидає готовність партнера', () => {
    const { state } = bothInGame();
    const reset = resetSlot(ok(setReady(state, 'male', true)), 'female');
    expect(reset.players.female).toBeNull();
    expect(reset.players.male?.ready).toBe(false);
  });
});
