import { and, desc, eq, inArray } from 'drizzle-orm';
import type { Prompt, PromptInput, PromptKind } from '@core/games/truth-or-dare/content.schema';
import type { Role } from '@core/roles';
import { db } from '../../db/client';
import { todHistory, todPrompts } from './schema';

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

  /** Увімкнені записи цього виду, які можна показати гравцеві цієї ролі. */
  activeFor(kind: PromptKind, role: Role): Prompt[] {
    return db
      .select(columns)
      .from(todPrompts)
      .where(and(eq(todPrompts.kind, kind), eq(todPrompts.active, true), inArray(todPrompts.audience, [role, 'both'])))
      .all();
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

export const historyRepository = {
  doneIds(): number[] {
    return db
      .selectDistinct({ promptId: todHistory.promptId })
      .from(todHistory)
      .all()
      .map((row) => row.promptId);
  },

  record(promptId: number) {
    db.insert(todHistory).values({ promptId }).run();
  },

  clear(promptIds: number[]) {
    if (promptIds.length === 0) return;
    db.delete(todHistory).where(inArray(todHistory.promptId, promptIds)).run();
  },
};
