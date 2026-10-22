import { and, desc, eq } from 'drizzle-orm';
import type { Scenario, ScenarioInput, ScenarioSummary } from '@core/games/role-play/content.schema';
import { db } from '../../db/client';
import { rpScenarios } from './schema';

const columns = {
  id: rpScenarios.id,
  title: rpScenarios.title,
  intensity: rpScenarios.intensity,
  active: rpScenarios.active,
  male: rpScenarios.male,
  female: rpScenarios.female,
};

export const scenariosRepository = {
  /** Усі сценарії для редактора, нові зверху. */
  list(): Scenario[] {
    return db.select(columns).from(rpScenarios).orderBy(desc(rpScenarios.id)).all();
  },

  get(id: number): Scenario | undefined {
    return db.select(columns).from(rpScenarios).where(eq(rpScenarios.id, id)).get();
  },

  /** Для гри: лише увімкнений сценарій. */
  getActive(id: number): Scenario | undefined {
    return db
      .select(columns)
      .from(rpScenarios)
      .where(and(eq(rpScenarios.id, id), eq(rpScenarios.active, true)))
      .get();
  },

  /** Для списку в грі: увімкнені сценарії без карток ролей. */
  catalog(): ScenarioSummary[] {
    return db
      .select({ id: rpScenarios.id, title: rpScenarios.title, intensity: rpScenarios.intensity })
      .from(rpScenarios)
      .where(eq(rpScenarios.active, true))
      .orderBy(rpScenarios.id)
      .all();
  },

  create(input: ScenarioInput): Scenario {
    return db.insert(rpScenarios).values(input).returning(columns).get();
  },

  update(id: number, patch: Partial<ScenarioInput>): Scenario | undefined {
    if (Object.keys(patch).length === 0) return this.get(id);
    return db.update(rpScenarios).set(patch).where(eq(rpScenarios.id, id)).returning(columns).get();
  },

  remove(id: number): boolean {
    return db.delete(rpScenarios).where(eq(rpScenarios.id, id)).run().changes > 0;
  },
};
