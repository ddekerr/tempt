import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import type { GameMeta } from '@core/game';
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

/** Єдина кімната: зберігає стан у пам'яті, тримає сокети двох телефонів і розсилає їм актуальний вигляд. */
export class RoomManager {
  private state: RoomState = createRoom();
  private readonly sockets = new Map<Role, WebSocket>();
  private readonly games: GameMeta[];

  constructor(games: GameMeta[]) {
    this.games = games;
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

    this.state = result.state;
    this.send(socket, { type: 'joined', token: result.token });
    this.broadcast();
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
      default:
        // join обробляє gateway; updateSettings і gameAction додаються разом із самою грою
        return;
    }
  }

  disconnect(role: Role, socket: WebSocket) {
    if (!this.isBound(role, socket)) return;
    this.sockets.delete(role);
    this.state = disconnect(this.state, role);
    this.broadcast();
  }

  /** Кнопка «Скинути» на комп'ютері: звільняє слот і відключає телефон. */
  resetSlot(role: Role) {
    this.sockets.get(role)?.close(CLOSE_RESET, 'reset');
    this.sockets.delete(role);
    this.state = resetSlot(this.state, role);
    this.broadcast();
  }

  hostStatus() {
    return slotStatuses(this.state);
  }

  private apply(role: Role, result: RoomState | RoomError) {
    if (isRoomError(result)) return this.rejectRole(role, result.error);
    this.state = result;
    this.broadcast();
  }

  private rejectRole(role: Role, message: string) {
    const socket = this.sockets.get(role);
    if (socket) this.reject(socket, message);
  }

  private broadcast() {
    for (const role of ROLES) {
      const socket = this.sockets.get(role);
      const room = viewOfRoom(this.state, role, this.games);
      if (socket && room) this.send(socket, { type: 'roomUpdate', room });
    }
  }

  private send(socket: WebSocket, message: ServerMessage) {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
  }
}
