import { describe, expect, it } from 'vitest';
import { ClientMessageSchema } from './protocol';

describe('ClientMessageSchema', () => {
  it('приймає коректне повідомлення join', () => {
    expect(ClientMessageSchema.safeParse({ type: 'join', name: 'Аня' }).success).toBe(true);
  });

  it('відкидає join з порожнім іменем', () => {
    expect(ClientMessageSchema.safeParse({ type: 'join', name: '   ' }).success).toBe(false);
  });

  it('відкидає невідомий тип повідомлення', () => {
    expect(ClientMessageSchema.safeParse({ type: 'hack' }).success).toBe(false);
  });
});
