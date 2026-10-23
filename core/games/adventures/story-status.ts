import type { StoryDef, StoryProgress, StorySummary } from './types';

/**
 * Історії проходяться по черзі: наступна відкривається, коли пройдена попередня.
 * Порядок у `defs` це і є порядок проходження.
 */
export function summarizeStories(defs: StoryDef[], progress: StoryProgress[]): StorySummary[] {
  const byId = new Map(progress.map((item) => [item.storyId, item]));

  return defs.map((def, index) => {
    const saved = byId.get(def.id);
    const previousDone = index === 0 || byId.get(defs[index - 1].id)?.done === true;
    const order = index + 1;

    if (saved?.done) return { ...def, order, status: 'done', chapter: def.chapters };
    if (saved) return { ...def, order, status: 'started', chapter: Math.min(Math.max(saved.chapter, 1), def.chapters) };
    return { ...def, order, status: previousDone ? 'new' : 'locked', chapter: 0 };
  });
}
