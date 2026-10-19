import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import type { RawData } from 'ws';
import { ClientMessageSchema, type ServerMessage } from '@core/protocol';
import { runMigrations } from './db/migrate';
import { truthOrDareRoutes } from './games/truth-or-dare/routes';
import { getLanIp } from './net/lan-ip';
import { isLocalRequest, localOnly } from './net/local-only';

const PORT = Number(process.env.PORT ?? 3000);
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/web');

/** Сторінки, які відкриваються лише з самого комп'ютера. */
const LOCAL_ONLY_PAGES = ['/editor', '/host'];

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

async function main() {
  runMigrations();

  const app = Fastify({ logger: true });

  await app.register(websocket);

  // Увесь /api доступний лише з комп'ютера: це редактори ігор. Телефони працюють через /ws.
  await app.register(
    async (api) => {
      api.addHook('onRequest', localOnly);
      api.get('/health', async () => ({ ok: true }));
      await api.register(truthOrDareRoutes, { prefix: '/games/truth-or-dare' });
    },
    { prefix: '/api' },
  );

  app.get('/ws', { websocket: true }, (socket) => {
    socket.on('message', (raw: RawData) => {
      const message = ClientMessageSchema.safeParse(parseJson(raw.toString()));
      if (!message.success) {
        const reply: ServerMessage = { type: 'error', message: 'Некоректне повідомлення' };
        socket.send(JSON.stringify(reply));
        return;
      }
      app.log.info({ type: message.data.type }, 'ws message');
    });
  });

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
