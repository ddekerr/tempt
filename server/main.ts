import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { hostRoutes } from './api/host.routes';
import { runMigrations } from './db/migrate';
import { rolePlayRoutes } from './games/role-play/routes';
import { RUNTIMES } from './games/registry';
import { truthOrDareRoutes } from './games/truth-or-dare/routes';
import { getLanIp } from './net/lan-ip';
import { isLocalRequest, localOnly } from './net/local-only';
import { registerGateway } from './net/ws-gateway';
import { RoomManager } from './rooms/room-manager';

const PORT = Number(process.env.PORT ?? 3000);
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/web');

/** Сторінки, які відкриваються лише з самого комп'ютера. */
const LOCAL_ONLY_PAGES = ['/editor', '/host'];

async function main() {
  runMigrations();

  const app = Fastify({ logger: true });
  const rooms = new RoomManager(RUNTIMES);

  await app.register(websocket);

  // Увесь /api доступний лише з комп'ютера: це редактори ігор і сторінка /host. Телефони працюють через /ws.
  await app.register(
    async (api) => {
      api.addHook('onRequest', localOnly);
      api.get('/health', async () => ({ ok: true }));
      await api.register(hostRoutes(rooms), { prefix: '/host' });
      await api.register(truthOrDareRoutes, { prefix: '/games/truth-or-dare' });
      await api.register(rolePlayRoutes, { prefix: '/games/role-play' });
    },
    { prefix: '/api' },
  );

  registerGateway(app, rooms);

  // У готовому вигляді цей самий процес роздає зібраний фронтенд.
  if (existsSync(webRoot)) {
    await app.register(fastifyStatic, { root: webRoot });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api')) return reply.code(404).send({ error: 'Not found' });
      if (LOCAL_ONLY_PAGES.some((page) => request.url.startsWith(page)) && !isLocalRequest(request)) {
        return reply.code(403).send({ error: "Ця сторінка доступна лише з комп'ютера" });
      }
      return reply.sendFile('index.html');
    });
  }

  await app.listen({ port: PORT, host: '0.0.0.0' });

  const lanIp = getLanIp();
  if (lanIp) app.log.info(`У домашній мережі: http://${lanIp}:${PORT}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
