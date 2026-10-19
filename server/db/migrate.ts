import { existsSync } from 'node:fs';
import path from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client';

/** Застосовує міграції зі server/db/migrations. Нові створює `npm run db:generate`. */
export function runMigrations() {
  const folder = path.resolve(import.meta.dirname, 'migrations');
  if (!existsSync(path.join(folder, 'meta', '_journal.json'))) {
    throw new Error('Немає міграцій бази. Виконай `npm run db:generate` і запусти сервер ще раз.');
  }
  migrate(db, { migrationsFolder: folder });
}
