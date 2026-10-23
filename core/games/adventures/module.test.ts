import { describe, expect, it } from 'vitest';
import { adventuresModule } from './module';
import { makeCtx } from './test-ctx';
import { summarizeStories } from './story-status';
import { AdvActionSchema, newHero, type StoryDef, type TreasureItem } from './types';

const DEFS: StoryDef[] = [
  { id: 'a', title: 'Перша', description: 'Опис', chapters: 5 },
  { id: 'b', title: 'Друга', description: 'Опис', chapters: 3 },
  { id: 'c', title: 'Третя', description: 'Опис', chapters: 4 },
];

const players = { male: { name: 'Дмитро' }, female: { name: 'Катя' } };

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
    const ctx = makeCtx({ data: { heroes: { male: { ...newHero(), title: 'Розвідник' }, female: newHero() } } });
    const state = adventuresModule.init(players, ctx);
    expect(state.stories.length).toBeGreaterThan(0);
    expect(state.heroes.male.title).toBe('Розвідник');
    expect(state.run).toBeNull();
  });

  it('кожен бачить себе як героя, а партнера як партнера', () => {
    const ctx = makeCtx({
      data: {
        heroes: { male: { ...newHero(), title: 'Розвідник' }, female: { ...newHero(), title: 'Чарівниця' } },
      },
    });
    const state = adventuresModule.init(players, ctx);
    const male = adventuresModule.viewFor(state, 'male');
    const female = adventuresModule.viewFor(state, 'female');

    expect(male.hero).toMatchObject({ name: 'Дмитро', title: 'Розвідник' });
    expect(male.partner).toMatchObject({ name: 'Катя', title: 'Чарівниця' });
    expect(female.hero).toMatchObject({ name: 'Катя', title: 'Чарівниця' });
    expect(female.partner).toMatchObject({ name: 'Дмитро', title: 'Розвідник' });
  });

  it('скарбниця й історії спільні для обох', () => {
    const treasure: TreasureItem = { id: 1, kind: 'item', name: 'Кільце', icon: '💍', description: '', effect: null };
    const state = adventuresModule.init(players, makeCtx({ data: { treasury: [treasure] } }));
    expect(adventuresModule.viewFor(state, 'male').treasury).toEqual([treasure]);
    expect(adventuresModule.viewFor(state, 'female').treasury).toEqual([treasure]);
  });

  it('refresh підтягує зміни з бази, а імена лишає', () => {
    const ctx = makeCtx();
    const state = adventuresModule.init(players, ctx);

    ctx.data.heroes.male = { ...ctx.data.heroes.male, level: 2, hp: 1 };
    ctx.data.progress = [{ storyId: ctx.stories()[0].id, chapter: 3, done: false }];

    const next = adventuresModule.reduce(state, { type: 'refresh' }, 'male', ctx);
    if ('error' in next) throw new Error(next.error);

    expect(adventuresModule.viewFor(next, 'male').hero).toMatchObject({ name: 'Дмитро', level: 2, hp: 1 });
    expect(next.stories[0]).toMatchObject({ status: 'started', chapter: 3 });
  });

  it('новий герой починає з повними життями й одягом', () => {
    expect(newHero()).toEqual({ title: 'Шукач пригод', level: 1, xp: 0, hp: 3, clothing: 5 });
  });

  it('схема дії приймає відомі дії й відкидає сміття', () => {
    expect(AdvActionSchema.safeParse({ type: 'refresh' }).success).toBe(true);
    expect(AdvActionSchema.safeParse({ type: 'start', storyId: 'masquerade' }).success).toBe(true);
    expect(AdvActionSchema.safeParse({ type: 'wish', text: '' }).success).toBe(false);
    expect(AdvActionSchema.safeParse({ type: 'win' }).success).toBe(false);
  });
});
