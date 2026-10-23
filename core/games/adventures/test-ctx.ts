import { scriptById, STORIES } from './stories';
import type { StoryScript } from './script.types';
import { newHero, type AdvCtx, type Hero, type StoryDef, type StoryProgress, type TreasureItem } from './types';

/** Дрібний детермінований генератор, щоб тести проходили однаково щоразу. */
export function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TestData {
  progress: StoryProgress[];
  heroes: Record<'male' | 'female', Hero>;
  treasury: TreasureItem[];
}

/** Контекст у пам'яті: те саме, що сервер робить із базою. */
export function makeCtx(options: { random?: () => number; scripts?: StoryScript[]; data?: Partial<TestData> } = {}) {
  const data: TestData = {
    progress: [],
    heroes: { male: newHero(), female: newHero() },
    treasury: [],
    ...options.data,
  };
  let nextId = 1;
  const scripts = options.scripts;
  const defs: StoryDef[] = scripts
    ? scripts.map((s) => ({ id: s.id, title: s.title, description: s.description, chapters: s.chapters.length }))
    : STORIES;

  const ctx: AdvCtx & { data: TestData; random: () => number } = {
    data,
    random: options.random ?? seeded(1),
    stories: () => defs,
    script: (id) => (scripts ? scripts.find((s) => s.id === id) : scriptById(id)),
    progress: () => data.progress.map((p) => ({ ...p })),
    hero: (role) => ({ ...data.heroes[role] }),
    treasury: () => data.treasury.map((t) => ({ ...t })),
    saveHero: (role, hero) => {
      data.heroes[role] = { ...hero };
    },
    saveProgress: (progress) => {
      data.progress = [...data.progress.filter((p) => p.storyId !== progress.storyId), { ...progress }];
    },
    addTreasure: (item) => {
      data.treasury.push({ ...item, id: nextId++ });
    },
    removeTreasure: (id) => {
      data.treasury = data.treasury.filter((t) => t.id !== id);
    },
  };
  return ctx;
}
