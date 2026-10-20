import type { FastifyPluginAsync } from 'fastify';
import QRCode from 'qrcode';
import type { HostQr } from '@core/host';
import { ROLES, RoleSchema } from '@core/roles';
import { getLanIp } from '../net/lan-ip';
import type { RoomManager } from '../rooms/room-manager';

/** Для сторінки /host на комп'ютері: два QR-коди, статус слотів і скидання слота. */
export const hostRoutes =
  (rooms: RoomManager): FastifyPluginAsync =>
  async (app) => {
    app.get('/qr', async (request, reply) => {
      const lanIp = getLanIp();
      if (!lanIp) {
        return reply.code(503).send({ error: "Не знайдено адресу в мережі. Підключи комп'ютер до Wi-Fi" });
      }

      // Порт беремо з адреси, за якою відкрито /host: у dev це Vite, у готовому вигляді сам сервер.
      const port = request.headers.host?.split(':')[1];
      const origin = `http://${lanIp}${port ? `:${port}` : ''}`;

      const options = { margin: 1, width: 360, color: { dark: '#14070a', light: '#f4e9e1' } };
      const entries = await Promise.all(
        ROLES.map(async (role) => {
          const url = `${origin}/play/${role}`;
          return [role, { url, qr: await QRCode.toDataURL(url, options) }] as const;
        }),
      );
      return Object.fromEntries(entries) as HostQr;
    });

    app.get('/status', async () => rooms.hostStatus());

    app.post('/reset/:role', async (request, reply) => {
      const role = RoleSchema.safeParse((request.params as { role?: string }).role);
      if (!role.success) return reply.code(400).send({ error: 'Невідома роль' });
      rooms.resetSlot(role.data);
      return reply.code(204).send();
    });
  };
