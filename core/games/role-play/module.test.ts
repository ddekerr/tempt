import { describe, expect, it } from 'vitest';
import type { Role } from '../../roles';
import type { RoleCard, Scenario, ScenarioSummary } from './content.schema';
import { rolePlayModule } from './module';
import { RpActionSchema, type RpCtx, type RpState } from './types';

const card = (roleName: string, secret: string): RoleCard => ({
  roleName,
  description: `Опис: ${secret}`,
  howToStart: `Початок: ${secret}`,
  phrases: [`Фраза: ${secret}`],
  outfit: `Одяг: ${secret}`,
  guide: `Роль: ${secret}`,
});

const scenario = (id: number, intensity: Scenario['intensity']): Scenario => ({
  id,
  title: `Сценарій ${id}`,
  intensity,
  active: true,
  male: card(`Він-${id}`, `СЕКРЕТ-ЧОЛОВІКА-${id}`),
  female: card(`Вона-${id}`, `СЕКРЕТ-ЖІНКИ-${id}`),
});

function makeCtx(all: Scenario[], random = () => 0): RpCtx & { all: Scenario[] } {
  const ctx = {
    all,
    random,
    catalog: (): ScenarioSummary[] => ctx.all.map(({ id, title, intensity }) => ({ id, title, intensity })),
    scenario: (id: number) => ctx.all.find((item) => item.id === id),
  };
  return ctx;
}

const players = { male: { name: 'Дмитро' }, female: { name: 'Аня' } };
const ALL = [scenario(1, 'gentle'), scenario(2, 'medium'), scenario(3, 'medium'), scenario(4, 'bdsm')];

function run(state: RpState, action: Parameters<typeof rolePlayModule.reduce>[1], ctx: RpCtx, by: Role = 'male') {
  const result = rolePlayModule.reduce(state, action, by, ctx);
  if ('error' in result) throw new Error(result.error);
  return result;
}

describe('role-play: вибір сценарію', () => {
  it('починає зі списку сценаріїв', () => {
    const state = rolePlayModule.init(players, makeCtx(ALL));
    expect(state.phase).toBe('choosing');
    expect(rolePlayModule.viewFor(state, 'male')).toMatchObject({ mode: 'choosing' });
  });

  it('pick відкриває обраний сценарій обом гравцям', () => {
    const ctx = makeCtx(ALL);
    const state = run(rolePlayModule.init(players, ctx), { type: 'pick', scenarioId: 2 }, ctx, 'female');
    expect(state.phase).toBe('playing');
    expect(rolePlayModule.viewFor(state, 'male')).toMatchObject({ mode: 'playing', scenarioId: 2 });
    expect(rolePlayModule.viewFor(state, 'female')).toMatchObject({ mode: 'playing', scenarioId: 2 });
  });

  it('відмовляє, якщо сценарію немає або він уже обраний', () => {
    const ctx = makeCtx(ALL);
    const initial = rolePlayModule.init(players, ctx);
    expect(rolePlayModule.reduce(initial, { type: 'pick', scenarioId: 99 }, 'male', ctx)).toEqual({
      error: 'Сценарій не знайдено',
    });

    const playing = run(initial, { type: 'pick', scenarioId: 1 }, ctx);
    expect(rolePlayModule.reduce(playing, { type: 'pick', scenarioId: 2 }, 'female', ctx)).toEqual({
      error: 'Сценарій уже обрано',
    });
  });
});

describe('role-play: приватність ролей', () => {
  it('кожен гравець отримує лише свою картку, чужої в його вигляді немає', () => {
    const ctx = makeCtx(ALL);
    const state = run(rolePlayModule.init(players, ctx), { type: 'pick', scenarioId: 3 }, ctx);

    const maleView = JSON.stringify(rolePlayModule.viewFor(state, 'male'));
    const femaleView = JSON.stringify(rolePlayModule.viewFor(state, 'female'));

    expect(maleView.includes('СЕКРЕТ-ЧОЛОВІКА-3')).toBe(true);
    expect(maleView.includes('СЕКРЕТ-ЖІНКИ-3')).toBe(false);
    expect(femaleView.includes('СЕКРЕТ-ЖІНКИ-3')).toBe(true);
    expect(femaleView.includes('СЕКРЕТ-ЧОЛОВІКА-3')).toBe(false);
  });

  it('показує назву ролі партнера, але не її вміст', () => {
    const ctx = makeCtx(ALL);
    const state = run(rolePlayModule.init(players, ctx), { type: 'pick', scenarioId: 1 }, ctx);
    expect(rolePlayModule.viewFor(state, 'male')).toMatchObject({ partnerRoleName: 'Вона-1' });
    expect(rolePlayModule.viewFor(state, 'female')).toMatchObject({ partnerRoleName: 'Він-1' });
  });
});

describe('role-play: «Мені пощастить»', () => {
  it('вибирає лише з обраного рівня', () => {
    const ctx = makeCtx(ALL);
    const state = run(rolePlayModule.init(players, ctx), { type: 'random', intensity: 'bdsm' }, ctx);
    expect(state.scenario?.id).toBe(4);
  });

  it('повідомляє, якщо для рівня немає сценаріїв', () => {
    const ctx = makeCtx([scenario(1, 'gentle')]);
    const initial = rolePlayModule.init(players, ctx);
    expect(rolePlayModule.reduce(initial, { type: 'random', intensity: 'intense' }, 'male', ctx)).toEqual({
      error: 'Немає сценаріїв для цього вибору. Додай їх у редакторі.',
    });
  });

  it('не повторює сценарії, доки є нові, а потім починає коло знову', () => {
    const ctx = makeCtx([scenario(1, 'medium'), scenario(2, 'medium')]);
    let state = rolePlayModule.init(players, ctx);

    state = run(state, { type: 'random', intensity: null }, ctx);
    const first = state.scenario?.id;
    state = run(state, { type: 'back' }, ctx);
    state = run(state, { type: 'random', intensity: null }, ctx);
    expect(state.scenario?.id).not.toBe(first);

    state = run(state, { type: 'back' }, ctx);
    state = run(state, { type: 'random', intensity: null }, ctx);
    expect([1, 2]).toContain(state.scenario?.id);
  });
});

describe('role-play: повернення до списку', () => {
  it('back повертає до списку й підтягує зміни з редактора', () => {
    const ctx = makeCtx(ALL);
    let state = run(rolePlayModule.init(players, ctx), { type: 'pick', scenarioId: 1 }, ctx);

    ctx.all = [...ctx.all, scenario(5, 'gentle')];
    state = run(state, { type: 'back' }, ctx, 'female');

    expect(state.phase).toBe('choosing');
    expect(state.scenario).toBeNull();
    expect(state.catalog.some((item) => item.id === 5)).toBe(true);
  });

  it('back поза сценарієм нічого не робить', () => {
    const ctx = makeCtx(ALL);
    expect(rolePlayModule.reduce(rolePlayModule.init(players, ctx), { type: 'back' }, 'male', ctx)).toEqual({
      error: 'Нічого повертати',
    });
  });
});

describe('RpActionSchema', () => {
  it('приймає коректні дії й відкидає сміття', () => {
    expect(RpActionSchema.safeParse({ type: 'pick', scenarioId: 1 }).success).toBe(true);
    expect(RpActionSchema.safeParse({ type: 'random', intensity: null }).success).toBe(true);
    expect(RpActionSchema.safeParse({ type: 'random', intensity: 'extreme' }).success).toBe(false);
    expect(RpActionSchema.safeParse({ type: 'pick', scenarioId: 'x' }).success).toBe(false);
  });
});
