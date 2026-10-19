import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { ClientMessageSchema, type ServerMessage } from '@core/protocol';
import { getLanIp } from './net/lan-ip';

const PORT = Number(process.env.PORT ?? 3000);
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/web');

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

async function main() {
  const app = Fastify({ logger: true });

  await app.register(websocket);

  app.get('/api/health', async () => ({ ok: true }));

  app.get('/ws', { websocket: true }, (socket) => {
    socket.on('message', (raw) => {
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
