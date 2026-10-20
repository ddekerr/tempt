import type { FastifyInstance } from 'fastify';
import type { RawData } from 'ws';
import { ClientMessageSchema, CLOSE_BAD_ROLE } from '@core/protocol';
import { RoleSchema } from '@core/roles';
import type { RoomManager } from '../rooms/room-manager';

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** WebSocket телефонів: /ws?role=male|female. Роль береться з адреси, тому телефон її не надсилає. */
export function registerGateway(app: FastifyInstance, rooms: RoomManager) {
  app.get('/ws', { websocket: true }, (socket, request) => {
    const role = RoleSchema.safeParse((request.query as { role?: string }).role);
    if (!role.success) {
      socket.close(CLOSE_BAD_ROLE, 'bad role');
      return;
    }

    socket.on('message', (raw: RawData) => {
      const parsed = ClientMessageSchema.safeParse(parseJson(raw.toString()));
      if (!parsed.success) return rooms.reject(socket, 'Некоректне повідомлення');

      const message = parsed.data;
      if (message.type === 'join') return rooms.join(role.data, socket, message.name, message.token);
      if (!rooms.isBound(role.data, socket)) return rooms.reject(socket, 'Спочатку увійди');
      rooms.handle(role.data, message);
    });

    socket.on('close', () => rooms.disconnect(role.data, socket));
  });
}
