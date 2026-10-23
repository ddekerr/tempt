import { describe, expect, it } from 'vitest';
import { adventuresModule } from './module';
import { summarizeStories } from './story-status';
import {
  AdvActionSchema,
  newHero,
  type AdvCtx,
  type Hero,
  type StoryDef,
  type StoryProgress,
  type TreasureItem,
} from './types';

const DEFS: StoryDef[] = [
  { id: 'a', title: 'Перша', description: 'Опис', chapters: 5 },
  { id: 'b', title: 'Друга', description: 'Опис', chapters: 3 },
  { id: 'c', title: 'Третя', description: 'Опис', chapters: 4 },
];

const players = { male: { name: 'Дмитро' }, female: { name: 'Катя' } };

function makeCtx(
  overrides: Partial<{
    progress: StoryProgress[];
    heroes: Record<'male' | 'female', Hero>;
    treasury: TreasureItem[];
  }> = {},
) {
  const data = {
    progress: [] as StoryProgress[],
    heroes: { male: { ...newHero(), title: 'Розвідник' }, female: { ...newHero(), title: 'Чарівниця' } },
    treasury: [] as TreasureItem[],
    ...overrides,
  };
  const ctx: AdvCtx & { data: typeof data } = {
    data,
    random: () => 0,
    stories: () => DEFS,
    progress: () => data.progress,
    hero: (role) => data.heroes[role],
    treasury: () => data.treasury,
  };
  return ctx;
}

describe('summarizeStories', () => {
  it('відкриває лише першу історію, решта закриті', () => {
    expect(summarizeStories(DEFS, []).map((s) => s.status)).toEqual(['new', 'locked', 'locked']);
  });

  it('рахує порядок і глави для розпочатої історії', () => {
    const [first] = summarizeStories(DEFS, [{ storyId: 'a', chapter: 2, done: false }]);
    expect(first).toMatchObject({ order: 1, status: 'started', chapter: 2 });
  });

  it('після проходження відкриває наступну', () => {
    const result = summarizeStories(DEFS, [{ storyId: 'a', chapter: 5, done: true }]);
    expect(result.map((s) => s.status)).toEqual(['done', 'new', 'locked']);
  });

  it('не виходить за межі глав', () => {
    const [first] = summarizeStories(DEFS, [{ storyId: 'a', chapter: 99, done: false }]);
    expect(first.chapter).toBe(5);
  });

  it('порожній список історій дає порожній результат', () => {
    expect(summarizeStories([], [])).toEqual([]);
  });
});

describe('adventuresModule', () => {
  it('init знімає стан із бази', () => {
    const state = adventuresModule.init(players, makeCtx());
    expect(state.stories).toHaveLength(3);
    expect(state.heroes.male.title).toBe('Розвідник');
  });

  it('кожен бачить лише свого героя з власним іменем', () => {
    const state = adventuresModule.init(players, makeCtx());
    const male = adventuresModule.viewFor(state, 'male');
    const female = adventuresModule.viewFor(state, 'female');

    expect(male.hero).toMatchObject({ name: 'Дмитро', title: 'Розвідник' });
    expect(female.hero).toMatchObject({ name: 'Катя', title: 'Чарівниця' });
    expect(JSON.stringify(male)).not.toContain('Чарівниця');
    expect(JSON.stringify(female)).not.toContain('Розвідник');
  });

  it('скарбниця й історії спільні для обох', () => {
    const treasure: TreasureItem = { id: 1, kind: 'item', name: 'Кільце', icon: '💍', description: '' };
    const state = adventuresModule.init(players, makeCtx({ treasury: [treasure] }));
    expect(adventuresModule.viewFor(state, 'male').treasury).toEqual([treasure]);
    expect(adventuresModule.viewFor(state, 'female').treasury).toEqual([treasure]);
  });

  it('refresh підтягує зміни з бази, а імена лишає', () => {
    const ctx = makeCtx();
    const state = adventuresModule.init(players, ctx);

    ctx.data.heroes.male = { ...ctx.data.heroes.male, level: 2, hp: 1 };
    ctx.data.progress = [{ storyId: 'a', chapter: 3, done: false }];

    const next = adventuresModule.reduce(state, { type: 'refresh' }, 'male', ctx);
    if ('error' in next) throw new Error(next.error);

    expect(adventuresModule.viewFor(next, 'male').hero).toMatchObject({ name: 'Дмитро', level: 2, hp: 1 });
    expect(next.stories[0]).toMatchObject({ status: 'started', chapter: 3 });
  });

  it('новий герой починає з повними життями й одягом', () => {
    expect(newHero()).toEqual({ title: 'Шукач пригод', level: 1, hp: 3, clothing: 5 });
  });

  it('схема дії приймає refresh і відкидає сміття', () => {
    expect(AdvActionSchema.safeParse({ type: 'refresh' }).success).toBe(true);
    expect(AdvActionSchema.safeParse({ type: 'win' }).success).toBe(false);
  });
});
