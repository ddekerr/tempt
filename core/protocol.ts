import { z } from 'zod';
import type { RoomView } from './room';

/**
 * Загальний протокол клієнт ↔ сервер. Роль визначається адресою підключення (/ws?role=male|female),
 * тому в повідомленнях її немає. `payload` дій гри для каркаса непрозорий: його перевіряє схема самої гри.
 */
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('join'), name: z.string().trim().min(1).max(32), token: z.string().optional() }),
  z.object({ type: z.literal('enterGame'), gameId: z.string() }),
  z.object({ type: z.literal('updateSettings'), payload: z.unknown() }),
  z.object({ type: z.literal('setReady'), ready: z.boolean() }),
  z.object({ type: z.literal('gameAction'), payload: z.unknown() }),
  z.object({ type: z.literal('leaveGame') }),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export type ServerMessage =
  | { type: 'error'; message: string }
  | { type: 'joined'; token: string }
  | { type: 'roomUpdate'; room: RoomView };

/** Коди закриття WebSocket, після яких клієнт не перепідключається сам. */
export const CLOSE_REPLACED = 4000;
export const CLOSE_RESET = 4001;
export const CLOSE_BAD_ROLE = 4400;
