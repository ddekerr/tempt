import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import { isGameError, type GameMeta } from '@core/game';
import { CLOSE_REPLACED, CLOSE_RESET, type ClientMessage, type ServerMessage } from '@core/protocol';
import { ROLES, type Role } from '@core/roles';
import {
  createRoom,
  disconnect,
  enterGame,
  isRoomError,
  joinRoom,
  leaveGame,
  resetSlot,
  setReady,
  slotStatuses,
  viewOfRoom,
  type RoomError,
  type RoomState,
} from '@core/room';
import type { GameRuntime } from '../games/runtime';

/** Гра, що зараз іде: стан живе лише в пам'яті й зникає, коли хтось виходить. */
interface Session {
  gameId: string;
  runtime: GameRuntime;
  state: unknown;
}

/** Єдина кімната: зберігає стан у пам'яті, тримає сокети двох телефонів і розсилає їм актуальний вигляд. */
export class RoomManager {
  private state: RoomState = createRoom();
  private session: Session | null = null;
  private readonly sockets = new Map<Role, WebSocket>();
  private readonly runtimes: GameRuntime[];
  private readonly games: GameMeta[];

  constructor(runtimes: GameRuntime[]) {
    this.runtimes = runtimes;
    this.games = runtimes.map((runtime) => runtime.meta);
  }

  join(role: Role, socket: WebSocket, name: string, token: string | undefined) {
    const result = joinRoom(this.state, role, name, token, randomUUID);
    if (isRoomError(result)) {
      this.send(socket, { type: 'error', message: result.error });
      return;
    }

    const previous = this.sockets.get(role);
    this.sockets.set(role, socket);
    if (previous && previous !== socket) previous.close(CLOSE_REPLACED, 'replaced');

    this.send(socket, { type: 'joined', token: result.token });
    this.commit(result.state);
  }

  isBound(role: Role, socket: WebSocket): boolean {
    return this.sockets.get(role) === socket;
  }

  reject(socket: WebSocket, message: string) {
    this.send(socket, { type: 'error', message });
  }

  handle(role: Role, message: ClientMessage) {
    switch (message.type) {
      case 'enterGame': {
        if (!this.games.some((game) => game.id === message.gameId)) return this.rejectRole(role, 'Невідома гра');
        return this.apply(role, enterGame(this.state, role, message.gameId));
      }
      case 'leaveGame':
        return this.apply(role, leaveGame(this.state, role));
      case 'setReady':
        return this.apply(role, setReady(this.state, role, message.ready));
      case 'gameAction':
        return this.gameAction(role, message.payload);
      default:
        // join обробляє gateway; updateSettings з'являться разом із першою грою, якій вони потрібні
        return;
    }
  }

  disconnect(role: Role, socket: WebSocket) {
    if (!this.isBound(role, socket)) return;
    this.sockets.delete(role);
    this.commit(disconnect(this.state, role));
  }

  /** Кнопка «Скинути» на комп'ютері: звільняє слот і відключає телефон. */
  resetSlot(role: Role) {
    this.sockets.get(role)?.close(CLOSE_RESET, 'reset');
    this.sockets.delete(role);
    this.commit(resetSlot(this.state, role));
  }

  hostStatus() {
    return slotStatuses(this.state);
  }

  private apply(role: Role, result: RoomState | RoomError) {
    if (isRoomError(result)) return this.rejectRole(role, result.error);
    this.commit(result);
  }

  private gameAction(role: Role, payload: unknown) {
    const session = this.session;
    if (!session) return this.rejectRole(role, 'Гра ще не почалась');

    try {
      const result = session.runtime.act(session.state, payload, role);
      if (isGameError(result)) return this.rejectRole(role, result.error);
      session.state = result.state;
      this.broadcast();
    } catch (error) {
      console.error(error);
      this.rejectRole(role, 'Помилка гри. Спробуй ще раз.');
    }
  }

  /** Приймає новий стан кімнати, запускає або закриває гру й розсилає вигляд обом телефонам. */
  private commit(next: RoomState) {
    this.state = next;
    this.syncSession();
    this.broadcast();
  }

  private syncSession() {
    const { gameId, playing, players } = this.state;
    if (!playing || !gameId) {
      this.session = null;
      return;
    }
    if (this.session?.gameId === gameId) return;

    const runtime = this.runtimes.find((item) => item.meta.id === gameId);
    if (!runtime || !players.male || !players.female) {
      this.session = null;
      return;
    }

    this.session = {
      gameId,
      runtime,
      state: runtime.init({ male: { name: players.male.name }, female: { name: players.female.name } }),
    };
  }

  private rejectRole(role: Role, message: string) {
    const socket = this.sockets.get(role);
    if (socket) this.reject(socket, message);
  }

  private broadcast() {
    for (const role of ROLES) {
      const socket = this.sockets.get(role);
      const room = viewOfRoom(this.state, role, this.games);
      if (!socket || !room) continue;

      this.send(socket, { type: 'roomUpdate', room });
      if (this.session) {
        const { gameId, runtime, state } = this.session;
        this.send(socket, { type: 'state', gameId, view: runtime.viewFor(state, role) });
      }
    }
  }

  private send(socket: WebSocket, message: ServerMessage) {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
  }
}
