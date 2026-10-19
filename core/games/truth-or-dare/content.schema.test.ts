import { describe, expect, it } from 'vitest';
import { PROMPT_TEXT_MAX, PromptInputSchema } from './content.schema';

const valid = { kind: 'truth', audience: 'both', text: 'Який твій найкращий спогад про нас?', active: true } as const;

describe('PromptInputSchema', () => {
  it('приймає коректний запис і обрізає пробіли по краях', () => {
    const result = PromptInputSchema.parse({ ...valid, text: '  привіт  ' });
    expect(result.text).toBe('привіт');
  });

  it('відкидає порожній текст', () => {
    expect(PromptInputSchema.safeParse({ ...valid, text: '   ' }).success).toBe(false);
  });

  it('відкидає надто довгий текст', () => {
    expect(PromptInputSchema.safeParse({ ...valid, text: 'а'.repeat(PROMPT_TEXT_MAX + 1) }).success).toBe(false);
  });

  it('відкидає невідомого адресата й невідомий вид', () => {
    expect(PromptInputSchema.safeParse({ ...valid, audience: 'all' }).success).toBe(false);
    expect(PromptInputSchema.safeParse({ ...valid, kind: 'quiz' }).success).toBe(false);
  });

  it('у частковому варіанті не підставляє значення за замовчуванням', () => {
    expect(PromptInputSchema.partial().parse({ active: false })).toEqual({ active: false });
  });
});
