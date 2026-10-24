import type { z } from 'zod';
import type { Role } from '../../roles';
import type { StoryNodeSchema, StoryScriptSchema } from './script.schema';

export { ITEM_EFFECTS } from './script.schema';

/**
 * Типи сценарію виводяться зі схеми, щоб форма даних і форма типів не розходились.
 * У текстах {male} і {female} підставляються іменами гравців. Після вузла за замовчуванням іде наступний
 * у масиві, а розгалуження посилаються на `id` вузлів; `next: "end"` завершує главу.
 */
export type StoryScript = z.infer<typeof StoryScriptSchema>;
export type StoryNode = z.infer<typeof StoryNodeSchema>;
export type Chapter = StoryScript['chapters'][number];
export type Episode = StoryScript['resurrection'][number];
export type RewardItem = Extract<StoryNode, { kind: 'reward' }>['item'];
export type ItemEffect = NonNullable<RewardItem['effect']>;
export type TaskWho = Role | 'both';
