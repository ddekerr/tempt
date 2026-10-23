import { z } from 'zod';
import type { Ctx } from '../../game';
import type { Role } from '../../roles';

export const HERO_HP_MAX = 3;
export const HERO_CLOTHING_MAX = 5;

/** Показники героя. Міняються протягом історій і лишаються між іграми, тому живуть у базі. */
export interface Hero {
  /** Хто він в історії. Поки історій немає, загальний титул. */
  title: string;
  level: number;
  hp: number;
  clothing: number;
}

export const newHero = (): Hero => ({
  title: 'Шукач пригод',
  level: 1,
  hp: HERO_HP_MAX,
  clothing: HERO_CLOTHING_MAX,
});

/** Герой, якого бачить гравець: до показників додається його ім'я з кімнати. */
export type HeroView = Hero & { name: string };

export const TREASURE_KINDS = ['item'] as const;
export type TreasureKind = (typeof TREASURE_KINDS)[number];

/** Предмет у спільній скарбниці. Наповнюється під час історій. */
export interface TreasureItem {
  id: number;
  kind: TreasureKind;
  name: string;
  /** Емодзі або символ. */
  icon: string;
  description: string;
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

/** Поки всі дії лише оновлюють знімок. Дії самих історій додаються разом із механікою. */
export const AdvActionSchema = z.discriminatedUnion('type', [z.object({ type: z.literal('refresh') })]);

export type AdvAction = z.infer<typeof AdvActionSchema>;

export interface AdvState {
  names: Record<Role, string>;
  stories: StorySummary[];
  heroes: Record<Role, Hero>;
  treasury: TreasureItem[];
}

/** Герой партнера сюди не потрапляє: кожен бачить лише свого. Скарбниця й історії спільні. */
export interface AdvView {
  stories: StorySummary[];
  hero: HeroView;
  treasury: TreasureItem[];
}

export interface AdvCtx extends Ctx {
  stories: () => StoryDef[];
  progress: () => StoryProgress[];
  hero: (role: Role) => Hero;
  treasury: () => TreasureItem[];
}
