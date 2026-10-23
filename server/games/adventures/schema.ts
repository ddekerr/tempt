import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
// Відносний імпорт, бо drizzle-kit читає цей файл окремо й може не знати аліасу @core.
import { ROLES } from '../../../core/roles';
import { ITEM_EFFECTS } from '../../../core/games/adventures/script.types';
import { TREASURE_KINDS } from '../../../core/games/adventures/types';

/** Герої: по одному на гравця. Рядка немає, поки герой не змінювався, тоді діють значення за замовчуванням. */
export const advHeroes = sqliteTable('adv_heroes', {
  role: text('role', { enum: ROLES }).primaryKey(),
  title: text('title').notNull(),
  level: integer('level').notNull(),
  xp: integer('xp').notNull().default(0),
  hp: integer('hp').notNull(),
  clothing: integer('clothing').notNull(),
});

/** Спільна скарбниця пари. */
export const advTreasury = sqliteTable('adv_treasury', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind', { enum: TREASURE_KINDS }).notNull(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  description: text('description').notNull().default(''),
  /** Що предмет вміє в історії: reroll, swap. Порожньо для прикрас і бажань. */
  effect: text('effect', { enum: ITEM_EFFECTS }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Прогрес по історіях. Рядка немає, поки історію не розпочато. */
export const advProgress = sqliteTable('adv_progress', {
  storyId: text('story_id').primaryKey(),
  chapter: integer('chapter').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
});
