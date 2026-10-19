import { z } from 'zod';

export const PROMPT_KINDS = ['truth', 'dare'] as const;
export const AUDIENCES = ['male', 'female', 'both'] as const;

export const PROMPT_TEXT_MAX = 500;

export type PromptKind = (typeof PROMPT_KINDS)[number];
export type Audience = (typeof AUDIENCES)[number];

/** Запис, який редагується в редакторі: питання («Правда») або завдання («Дія»). */
export const PromptInputSchema = z.object({
  kind: z.enum(PROMPT_KINDS),
  audience: z.enum(AUDIENCES),
  text: z.string().trim().min(1, 'Текст не може бути порожнім').max(PROMPT_TEXT_MAX),
  active: z.boolean(),
});

export const PromptSchema = PromptInputSchema.extend({ id: z.number().int().positive() });

export type PromptInput = z.infer<typeof PromptInputSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
