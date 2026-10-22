import { z } from 'zod';
import type { Ctx } from '../../game';
import type { Role } from '../../roles';
import { PROMPT_KINDS, type Prompt, type PromptKind } from './content.schema';

export const TodActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('choose'), kind: z.enum([...PROMPT_KINDS, 'random']) }),
  z.object({ type: z.literal('reroll') }),
  z.object({ type: z.literal('done') }),
]);

export type TodAction = z.infer<typeof TodActionSchema>;

export interface TodState {
  names: Record<Role, string>;
  /** Чия зараз черга. Лише цей гравець бачить запис і може діяти. */
  turn: Role;
  phase: 'choosing' | 'showing';
  kind: PromptKind | null;
  prompt: Prompt | null;
  /** Записи, які вже випали в цій грі (разом із пропущеними через «Оновити»). */
  seen: number[];
}

/** Що бачить гравець. Партнер, чия зараз не черга, отримує лише ім'я того, хто ходить. */
export type TodView =
  | { mode: 'choosing' }
  | { mode: 'showing'; kind: PromptKind; text: string }
  | { mode: 'watching'; name: string };

/** Дані гри, які надає сервер: записи з бази й історія виконаних. */
export interface TodCtx extends Ctx {
  /** Увімкнені записи цього виду, доступні гравцеві цієї ролі (для нього/для неї або для обох). */
  pool: (kind: PromptKind, role: Role) => Prompt[];
  history: {
    doneIds: () => number[];
    record: (promptId: number) => void;
    clear: (promptIds: number[]) => void;
  };
}
