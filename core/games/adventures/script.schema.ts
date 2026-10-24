import { z } from 'zod';
import { ROLES } from '../../roles';

/**
 * Форма сценарію історії. Сам текст лежить у `content/adventures/*.json` і перевіряється цією схемою
 * при завантаженні: опечатка в назві поля чи неіснуюче посилання дають зрозумілу помилку, а не зламану гру.
 * Лише `strict`-об'єкти: зайве поле це майже завжди помилка в написанні.
 */

export const ITEM_EFFECTS = ['reroll', 'swap', 'ward'] as const;

const text = z.string().trim().min(1, 'текст не може бути порожнім');
const key = z.string().min(1);
const role = z.enum(ROLES);

const base = { id: key.optional(), next: key.optional() };

const TitleNode = z.strictObject({ ...base, kind: z.literal('title'), title: text, text });

const SayNode = z.strictObject({ ...base, kind: z.literal('say'), speaker: text.optional(), text });

const ChoiceNode = z.strictObject({
  ...base,
  kind: z.literal('choice'),
  chooser: role,
  text,
  options: z
    .array(z.strictObject({ label: text, next: key }))
    .min(2)
    .max(4),
});

const CheckNode = z.strictObject({
  ...base,
  kind: z.literal('check'),
  roller: role,
  label: text,
  text,
  difficulty: z.number().int().min(2).max(20),
  onSuccess: key.optional(),
  onFail: key.optional(),
});

const DiceNode = z.strictObject({
  ...base,
  kind: z.literal('dice'),
  roller: role,
  text,
  outcomes: z
    .array(
      z.strictObject({ min: z.number().int().min(1).max(6), max: z.number().int().min(1).max(6), text, next: key }),
    )
    .min(1),
});

const TaskNode = z.strictObject({
  ...base,
  kind: z.literal('task'),
  who: z.enum(['male', 'female', 'both']),
  title: text,
  text,
  /** Секунди. */
  timer: z.number().int().positive().optional(),
});

const EffectNode = z.strictObject({
  ...base,
  kind: z.literal('effect'),
  who: role,
  text,
  hp: z.number().int().min(-3).max(3).optional(),
  clothing: z.number().int().min(-5).max(5).optional(),
});

const RewardNode = z.strictObject({
  ...base,
  kind: z.literal('reward'),
  text,
  item: z.strictObject({
    name: text,
    icon: text,
    description: text,
    /** Кожен предмет щось уміє. */
    effect: z.enum(ITEM_EFFECTS),
  }),
});

export const StoryNodeSchema = z.discriminatedUnion('kind', [
  TitleNode,
  SayNode,
  ChoiceNode,
  CheckNode,
  DiceNode,
  TaskNode,
  EffectNode,
  RewardNode,
]);

const EpisodeSchema = z.strictObject({ title: text, text, timer: z.number().int().positive().optional() });

export const StoryScriptSchema = z.strictObject({
  id: key,
  title: text,
  description: text,
  chapters: z.array(z.strictObject({ title: text, nodes: z.array(StoryNodeSchema).min(1) })).min(1),
  resurrection: z.array(EpisodeSchema).min(1),
  /** Ритуал вирішує d6, тож варіантів рівно шість. */
  ritual: z.array(EpisodeSchema).length(6),
  epilogue: text,
});
