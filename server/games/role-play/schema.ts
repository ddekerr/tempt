import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
// Відносний імпорт, бо drizzle-kit читає цей файл окремо й може не знати аліасу @core.
import { INTENSITIES, type RoleCard } from '../../../core/games/role-play/content.schema';

/** Сценарії «Рольових ігор». Картки ролей зберігаються як JSON: їх завжди читають разом зі сценарієм. */
export const rpScenarios = sqliteTable('rp_scenarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  intensity: text('intensity', { enum: INTENSITIES }).notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  male: text('male_role', { mode: 'json' }).$type<RoleCard>().notNull(),
  female: text('female_role', { mode: 'json' }).$type<RoleCard>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
