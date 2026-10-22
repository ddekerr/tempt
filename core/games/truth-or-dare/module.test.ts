import { describe, expect, it } from 'vitest';
import { isGameError } from '../../game';
import type { Prompt } from './content.schema';
import { truthOrDareModule as game } from './module';
import type { TodCtx, TodState } from './types';

const players = { male: { name: 'Дмитро' }, female: { name: 'Аня' } };

let nextId = 1;
const prompt = (kind: Prompt['kind'], audience: Prompt['audience'], text: string, active = true): Prompt => ({
  id: nextId++,
  kind,
  audience,
  text,
  active,
});

function makeCtx(prompts: Prompt[], random: () => number = () => 0) {
  const done = new Set<number>();
  const cleared: number[][] = [];
  const ctx: TodCtx = {
    random,
    pool: (kind, role) =>
      prompts.filter((p) => p.kind === kind && p.active && (p.audience === 'both' || p.audience === role)),
    history: {
      doneIds: () => [...done],
      record: (id) => void done.add(id),
      clear: (ids) => {
        cleared.push(ids);
        ids.forEach((id) => done.delete(id));
      },
    },
  };
  return { ctx, done, cleared };
}

function ok(result: TodState | { error: string }): TodState {
  if (isGameError(result)) throw new Error(result.error);
  return result;
}

describe('init', () => {
  it('першим ходить той, кого вибрав random', () => {
    const { ctx } = makeCtx([]);
    expect(game.init(players, { ...ctx, random: () => 0.1 }).turn).toBe('male');
    expect(game.init(players, { ...ctx, random: () => 0.9 }).turn).toBe('female');
  });
});

describe('choose', () => {
  const truthForHim = prompt('truth', 'male', 'питання для нього');
  const truthForHer = prompt('truth', 'female', 'питання для неї');
  const truthBoth = prompt('truth', 'both', 'питання для обох');
  const dare = prompt('dare', 'both', 'дія для обох');
  const disabled = prompt('truth', 'male', 'вимкнене', false);
  const all = [truthForHim, truthForHer, truthBoth, dare, disabled];

  it('показує запис, який підходить ролі й не вимкнений', () => {
    const { ctx } = makeCtx(all);
    const start = game.init(players, { ...ctx, random: () => 0.1 }); // ходить він
    const state = ok(game.reduce(start, { type: 'choose', kind: 'truth' }, 'male', ctx));
    expect(state.phase).toBe('showing');
    expect(['питання для нього', 'питання для обох']).toContain(state.prompt?.text);
    expect(state.prompt?.id).not.toBe(disabled.id);
    expect(state.prompt?.id).not.toBe(truthForHer.id);
  });

  it('відкидає дію, коли зараз не черга цього гравця', () => {
    const { ctx } = makeCtx(all);
    const start = game.init(players, { ...ctx, random: () => 0.1 });
    expect(game.reduce(start, { type: 'choose', kind: 'truth' }, 'female', ctx)).toEqual({
      error: 'Зараз не твоя черга',
    });
  });

  it('«Випадково» переходить до другого списку, якщо в обраному порожньо', () => {
    const { ctx } = makeCtx([dare]);
    const start = game.init(players, { ...ctx, random: () => 0 }); // ходить він, монетка дає правду
    const state = ok(game.reduce(start, { type: 'choose', kind: 'random' }, 'male', ctx));
    expect(state.kind).toBe('dare');
  });

  it('повідомляє, якщо записів немає взагалі', () => {
    const { ctx } = makeCtx([]);
    const start = game.init(players, { ...ctx, random: () => 0.1 });
    const result = game.reduce(start, { type: 'choose', kind: 'truth' }, 'male', ctx);
    expect(isGameError(result)).toBe(true);
  });
});

describe('хід гри', () => {
  const a = prompt('truth', 'both', 'перше');
  const b = prompt('truth', 'both', 'друге');

  it('«Готово» записує запис в історію й передає хід партнеру', () => {
    const { ctx, done } = makeCtx([a, b]);
    let state = game.init(players, { ...ctx, random: () => 0.1 });
    state = ok(game.reduce(state, { type: 'choose', kind: 'truth' }, 'male', ctx));
    const shown = state.prompt?.id;
    state = ok(game.reduce(state, { type: 'done' }, 'male', ctx));

    expect(done.has(shown as number)).toBe(true);
    expect(state).toMatchObject({ turn: 'female', phase: 'choosing', prompt: null });
  });

  it('«Оновити» дає інший запис і не повертає показаний', () => {
    const { ctx } = makeCtx([a, b]);
    let state = game.init(players, { ...ctx, random: () => 0.1 });
    state = ok(game.reduce(state, { type: 'choose', kind: 'truth' }, 'male', ctx));
    const first = state.prompt?.id;
    state = ok(game.reduce(state, { type: 'reroll' }, 'male', ctx));
    expect(state.prompt?.id).not.toBe(first);
  });

  it('«Оновити» повідомляє, коли інших записів немає', () => {
    const { ctx } = makeCtx([a]);
    let state = game.init(players, { ...ctx, random: () => 0.1 });
    state = ok(game.reduce(state, { type: 'choose', kind: 'truth' }, 'male', ctx));
    expect(game.reduce(state, { type: 'reroll' }, 'male', ctx)).toEqual({ error: 'Інших записів немає' });
  });

  it('не повторює виконані записи, а коли список скінчився, починає нове коло', () => {
    const { ctx, cleared } = makeCtx([a, b]);
    let state = game.init(players, { ...ctx, random: () => 0.1 });
    const shown: number[] = [];

    for (let turn = 0; turn < 3; turn++) {
      const by = state.turn;
      state = ok(game.reduce(state, { type: 'choose', kind: 'truth' }, by, ctx));
      shown.push(state.prompt?.id as number);
      state = ok(game.reduce(state, { type: 'done' }, by, ctx));
    }

    expect(shown[0]).not.toBe(shown[1]);
    expect(cleared.length).toBe(1); // після двох записів список очищено для нового кола
    expect([a.id, b.id]).toContain(shown[2]);
  });
});

describe('viewFor', () => {
  it('партнер бачить лише ім’я того, хто ходить, і не отримує текст запису', () => {
    const { ctx } = makeCtx([prompt('dare', 'both', 'секретний текст')]);
    let state = game.init(players, { ...ctx, random: () => 0.1 }); // ходить він
    state = ok(game.reduce(state, { type: 'choose', kind: 'dare' }, 'male', ctx));

    expect(game.viewFor(state, 'male')).toMatchObject({ mode: 'showing', text: 'секретний текст' });
    const partnerView = game.viewFor(state, 'female');
    expect(partnerView).toEqual({ mode: 'watching', name: 'Дмитро' });
    expect(JSON.stringify(partnerView)).not.toContain('секретний');
  });
});
