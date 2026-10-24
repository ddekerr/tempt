import { z } from 'zod';
import type { Ctx } from '../../game';
import type { Role } from '../../roles';
import type { Episode, ItemEffect, RewardItem, StoryScript, TaskWho } from './script.types';

export const HERO_HP_MAX = 3;
export const HERO_CLOTHING_MAX = 5;
export const XP_PER_LEVEL = 60;
export const WISH_MAX_LENGTH = 400;
/** Складність кидка на повернення, коли герой упав без сил. */
export const RESURRECT_DIFFICULTY = 8;

export const levelForXp = (xp: number) => 1 + Math.floor(xp / XP_PER_LEVEL);

/** Показники героя. Міняються протягом історій і лишаються між іграми, тому живуть у базі. */
export interface Hero {
  /** Хто він в історії. Поки історій немає, загальний титул. */
  title: string;
  level: number;
  xp: number;
  hp: number;
  clothing: number;
}

export const newHero = (): Hero => ({
  title: 'Шукач пригод',
  level: 1,
  xp: 0,
  hp: HERO_HP_MAX,
  clothing: HERO_CLOTHING_MAX,
});

/** Герой, якого бачить гравець: до показників додається його ім'я з кімнати. */
export type HeroView = Hero & { name: string };

export const TREASURE_KINDS = ['item', 'wish'] as const;
export type TreasureKind = (typeof TREASURE_KINDS)[number];

/** Предмет у спільній скарбниці. Наповнюється під час історій. */
export interface TreasureItem {
  id: number;
  kind: TreasureKind;
  name: string;
  /** Емодзі або символ. */
  icon: string;
  description: string;
  /** Що предмет вміє під час історії. Порожньо: просто прикраса. */
  effect: ItemEffect | null;
}

/** Опис історії. Порядок у списку визначає порядок проходження. */
export interface StoryDef {
  id: string;
  title: string;
  description: string;
  chapters: number;
}

/** Збережений прогрес: `chapter` це глава, на якій ви зараз (з 1). */
export interface StoryProgress {
  storyId: string;
  chapter: number;
  done: boolean;
}

export type StoryStatus = 'locked' | 'new' | 'started' | 'done';

export interface StorySummary extends StoryDef {
  /** З 1, для підпису «Пригода I». */
  order: number;
  status: StoryStatus;
  chapter: number;
}

export interface RollResult {
  value: number;
  success: boolean;
}

export type Stage = 'guide' | 'play' | 'ritual' | 'wish' | 'finish';

/** Те, що відбувається просто зараз: де ви в історії. Живе, поки відкрита кімната. */
export interface Run {
  storyId: string;
  chapter: number;
  stage: Stage;
  guide: number;
  /** Позиція у вузлах глави. */
  index: number;
  /** Результат кидка поточної сцени: d20 для перевірки, d6 для кубика. */
  roll: RollResult | null;
  /** Завдання передано партнерові амулетом. */
  swapped: boolean;
  /** Що востаннє змінила сцена-наслідок: потрібно, щоб показати, скільки справді втрачено. */
  applied: { hp: number; clothing: number; spill: boolean } | null;
  /** Герой без сил: чекає кидка на повернення. */
  dead: { who: Role; roll: RollResult | null; episode: number | null } | null;
  /** Кидок d6 на фінальний ритуал. */
  ritual: number | null;
  winner: Role | null;
  successes: Record<Role, number>;
  wish: string | null;
}

export const AdvActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('refresh') }),
  z.object({ type: z.literal('start'), storyId: z.string().min(1), fromStart: z.boolean().optional() }),
  z.object({ type: z.literal('advance') }),
  z.object({ type: z.literal('choose'), index: z.number().int().min(0).max(9) }),
  z.object({ type: z.literal('roll') }),
  z.object({ type: z.literal('use-item'), itemId: z.number().int() }),
  z.object({ type: z.literal('wish'), text: z.string().trim().min(1).max(WISH_MAX_LENGTH) }),
  z.object({ type: z.literal('leave') }),
]);

export type AdvAction = z.infer<typeof AdvActionSchema>;

export interface AdvState {
  names: Record<Role, string>;
  stories: StorySummary[];
  heroes: Record<Role, Hero>;
  treasury: TreasureItem[];
  run: Run | null;
  /** Сценарій поточної історії: потрібен, щоб показати сцену без бази. */
  script: StoryScript | null;
}

export type SceneBody =
  | { kind: 'guide'; title: string; text: string; index: number; total: number }
  | { kind: 'title'; title: string; text: string }
  | { kind: 'say'; speaker?: string; text: string }
  | { kind: 'choice'; text: string; chooser: Role; options: string[] }
  | { kind: 'check'; text: string; label: string; difficulty: number; roller: Role; roll: RollResult | null }
  | { kind: 'dice'; text: string; roller: Role; roll: number | null; outcome: string | null }
  | { kind: 'task'; who: TaskWho; title: string; text: string; timer?: number }
  | { kind: 'effect'; text: string; who: Role; hp: number; clothing: number; spill: boolean }
  | { kind: 'reward'; text: string; item: RewardItem }
  | { kind: 'dead'; who: Role; difficulty: number; roll: RollResult | null; episode: Episode | null }
  | { kind: 'ritual'; roll: number | null; episode: Episode | null }
  | { kind: 'wish'; winner: Role; successes: Record<Role, number> }
  | { kind: 'finish'; text: string; wish: string | null };

export interface SceneView {
  storyTitle: string;
  chapter: number;
  chapters: number;
  body: SceneBody;
  /** Хто має зараз діяти. `any`: будь-хто з двох. */
  actor: Role | 'any';
  /** Предмети зі скарбниці, які можна використати просто зараз. */
  usable: number[];
}

export interface AdvView {
  stories: StorySummary[];
  hero: HeroView;
  partner: HeroView;
  treasury: TreasureItem[];
  scene: SceneView | null;
}

export interface AdvCtx extends Ctx {
  stories: () => StoryDef[];
  script: (id: string) => StoryScript | undefined;
  progress: () => StoryProgress[];
  hero: (role: Role) => Hero;
  treasury: () => TreasureItem[];
  saveHero: (role: Role, hero: Hero) => void;
  saveProgress: (progress: StoryProgress) => void;
  addTreasure: (item: Omit<TreasureItem, 'id'>) => void;
  removeTreasure: (id: number) => void;
}
