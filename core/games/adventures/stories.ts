import { MASQUERADE } from './stories/masquerade';
import type { StoryScript } from './script.types';
import type { StoryDef } from './types';

/**
 * Каталог історій. Порядок тут це порядок проходження: наступна відкривається після попередньої.
 * Нова історія це один файл у `stories/` і один рядок тут.
 */
export const SCRIPTS: StoryScript[] = [MASQUERADE];

export const STORIES: StoryDef[] = SCRIPTS.map(({ id, title, description, chapters }) => ({
  id,
  title,
  description,
  chapters: chapters.length,
}));

export const scriptById = (id: string): StoryScript | undefined => SCRIPTS.find((script) => script.id === id);
