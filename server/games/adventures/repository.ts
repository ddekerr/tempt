import { eq } from 'drizzle-orm';
import { newHero, type Hero, type StoryProgress, type TreasureItem } from '@core/games/adventures/types';
import type { Role } from '@core/roles';
import { db } from '../../db/client';
import { advHeroes, advProgress, advTreasury } from './schema';

export const adventuresRepository = {
  /** Герой гравця. Якщо його ще не зберігали, віддаємо нового. */
  hero(role: Role): Hero {
    const row = db.select().from(advHeroes).where(eq(advHeroes.role, role)).get();
    return row ? { title: row.title, level: row.level, hp: row.hp, clothing: row.clothing } : newHero();
  },

  saveHero(role: Role, hero: Hero): void {
    db.insert(advHeroes)
      .values({ role, ...hero })
      .onConflictDoUpdate({ target: advHeroes.role, set: hero })
      .run();
  },

  treasury(): TreasureItem[] {
    return db
      .select({
        id: advTreasury.id,
        kind: advTreasury.kind,
        name: advTreasury.name,
        icon: advTreasury.icon,
        description: advTreasury.description,
      })
      .from(advTreasury)
      .orderBy(advTreasury.id)
      .all();
  },

  progress(): StoryProgress[] {
    return db.select().from(advProgress).all();
  },
};
