import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
// Відносний імпорт, бо drizzle-kit читає цей файл окремо й може не знати аліасу @core.
import { AUDIENCES, PROMPT_KINDS } from '../../../core/games/truth-or-dare/content.schema';

/** Таблиці «Правди або дії». Префікс tod_ відокремлює їх від таблиць інших ігор. */
export const todPrompts = sqliteTable('tod_prompts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind', { enum: PROMPT_KINDS }).notNull(),
  audience: text('audience', { enum: AUDIENCES }).notNull(),
  text: text('text').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Записи, які вже виконали. Завдяки цьому вони не повторюються, доки не скінчиться весь список. */
export const todHistory = sqliteTable('tod_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  promptId: integer('prompt_id')
    .notNull()
    .references(() => todPrompts.id, { onDelete: 'cascade' }),
  doneAt: integer('done_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
