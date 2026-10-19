import { desc, eq } from 'drizzle-orm';
import type { Prompt, PromptInput } from '@core/games/truth-or-dare/content.schema';
import { db } from '../../db/client';
import { todPrompts } from './schema';

const columns = {
  id: todPrompts.id,
  kind: todPrompts.kind,
  audience: todPrompts.audience,
  text: todPrompts.text,
  active: todPrompts.active,
};

export const promptsRepository = {
  list(): Prompt[] {
    return db.select(columns).from(todPrompts).orderBy(desc(todPrompts.id)).all();
  },

  get(id: number): Prompt | undefined {
    return db.select(columns).from(todPrompts).where(eq(todPrompts.id, id)).get();
  },

  create(input: PromptInput): Prompt {
    return db.insert(todPrompts).values(input).returning(columns).get();
  },

  update(id: number, patch: Partial<PromptInput>): Prompt | undefined {
    if (Object.keys(patch).length === 0) return this.get(id);
    return db.update(todPrompts).set(patch).where(eq(todPrompts.id, id)).returning(columns).get();
  },

  remove(id: number): boolean {
    return db.delete(todPrompts).where(eq(todPrompts.id, id)).run().changes > 0;
  },
};
