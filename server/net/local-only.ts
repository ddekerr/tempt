import type { FastifyReply, FastifyRequest } from 'fastify';

const isLoopback = (address: string) => {
  const value = address.trim();
  return value === '::1' || value.startsWith('127.') || value.startsWith('::ffff:127.');
};

/**
 * Запит прийшов з самого комп'ютера, де запущено сервер.
 * У dev-режимі Vite проксіює запити з телефона через localhost, тому окрім адреси сокета
 * перевіряємо X-Forwarded-For: кожен елемент ланцюжка теж має бути loopback.
 */
export function isLocalRequest(request: FastifyRequest): boolean {
  if (!isLoopback(request.socket.remoteAddress ?? '')) return false;

  const forwarded = request.headers['x-forwarded-for'];
  if (!forwarded) return true;
  return (Array.isArray(forwarded) ? forwarded.join(',') : forwarded).split(',').every(isLoopback);
}

export async function localOnly(request: FastifyRequest, reply: FastifyReply) {
  if (!isLocalRequest(request)) {
    return reply.code(403).send({ error: "Доступно лише з комп'ютера, де запущено сервер" });
  }
}
