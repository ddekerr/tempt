import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Спільні налаштування застосунку. Таблиці кожної гри лежать у server/games/<гра>/schema.ts. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
