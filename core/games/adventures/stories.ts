import masquerade from '../../../content/adventures/masquerade.json';
import { parseScript } from './script.validate';
import type { StoryScript } from './script.types';
import type { StoryDef } from './types';

/**
 * Каталог історій. Порядок тут це порядок проходження: наступна відкривається після попередньої.
 * Тексти лежать у `content/adventures/*.json` (див. README там). Нова історія це новий JSON і один рядок тут.
 * Помилку в JSON видно одразу при запуску, з номером глави й вузла.
 */
export const SCRIPTS: StoryScript[] = [parseScript('masquerade.json', masquerade)];

export const STORIES: StoryDef[] = SCRIPTS.map(({ id, title, description, chapters }) => ({
  id,
  title,
  description,
  chapters: chapters.length,
}));

export const scriptById = (id: string): StoryScript | undefined => SCRIPTS.find((script) => script.id === id);
