import { describe, expect, it } from 'vitest';
import { applyAction, isFail } from './engine';
import { adventuresModule } from './module';
import type { Chapter, StoryScript } from './script.types';
import { makeCtx, seeded } from './test-ctx';
import { SCRIPTS } from './stories';
import type { AdvAction, AdvCtx, AdvState } from './types';
import { sceneFor } from './view';

const players = { male: { name: 'Дмитро' }, female: { name: 'Катя' } };

/** Крихітна історія з трьох сцен, щоб перевіряти правила окремо від справжнього тексту. */
function tiny(nodes: Chapter['nodes']): StoryScript {
  return {
    id: 't',
    title: 'Тест',
    description: '',
    guide: [],
    chapters: [{ title: 'Одна', nodes: [{ kind: 'title', title: 'Т', text: 'т' }, ...nodes] }],
    resurrection: [{ title: 'Р', text: 'р' }],
    ritual: Array.from({ length: 6 }, (_, i) => ({ title: `R${i}`, text: 'r' })),
    epilogue: 'кінець',
  };
}

function setup(script: StoryScript, queue: number[] = []) {
  const rest = seeded(7);
  const ctx = makeCtx({ scripts: [script], random: () => (queue.length ? queue.shift()! : rest()) });
  let state: AdvState = adventuresModule.init(players, ctx);
  const send = (action: AdvAction, by: 'male' | 'female' = 'male') => {
    const result = adventuresModule.reduce(state, action, by, ctx);
    if (!isFail(result)) state = result;
    return result;
  };
  return {
    ctx,
    send,
    get state() {
      return state;
    },
  };
}

const body = (game: { state: AdvState }) => sceneFor(game.state, game.state.script!).body;

describe('гід і старт', () => {
  it('нова історія з гідом спершу показує гід, потім главу', () => {
    const script = {
      ...tiny([{ kind: 'say', text: 'а' }]),
      guide: [
        { title: 'Г1', text: 'x' },
        { title: 'Г2', text: 'y' },
      ],
    };
    const game = setup(script);
    game.send({ type: 'start', storyId: 't' });
    expect(body(game)).toMatchObject({ kind: 'guide', index: 0, total: 2 });
    game.send({ type: 'advance' });
    game.send({ type: 'advance' });
    expect(body(game)).toMatchObject({ kind: 'title' });
    expect(game.ctx.data.progress).toEqual([{ storyId: 't', chapter: 1, done: false }]);
  });

  it('не можна стартувати двічі чи відкрити закриту історію', () => {
    const game = setup(tiny([]));
    game.send({ type: 'start', storyId: 't' });
    expect(game.send({ type: 'start', storyId: 't' })).toHaveProperty('error');
    expect(setup(tiny([])).send({ type: 'start', storyId: 'нема' })).toHaveProperty('error');
  });

  it('вихід у меню зберігає прогрес, і історію можна продовжити', () => {
    const game = setup(tiny([]));
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'leave' });
    expect(game.state.run).toBeNull();
    expect(game.state.stories[0]).toMatchObject({ status: 'started', chapter: 1 });
    game.send({ type: 'start', storyId: 't' });
    expect(game.state.run?.chapter).toBe(1);
  });
});

describe('кидки', () => {
  const check = (difficulty: number): Chapter['nodes'] => [
    { kind: 'check', roller: 'female', label: 'К', text: 'к', difficulty, onSuccess: 'ok', onFail: 'bad' },
    { id: 'ok', kind: 'say', text: 'вийшло', next: 'end' },
    { id: 'bad', kind: 'say', text: 'не вийшло' },
  ];

  it('кидає лише названий герой, один раз', () => {
    const game = setup(tiny(check(11)), [0.5]);
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    expect(game.send({ type: 'roll' }, 'male')).toHaveProperty('error');
    expect(game.send({ type: 'roll' }, 'female')).not.toHaveProperty('error');
    expect(game.send({ type: 'roll' }, 'female')).toHaveProperty('error');
  });

  it('успіх, коли випало не менше за складність, дає XP і вдалий кидок', () => {
    const game = setup(tiny(check(11)), [0.5]); // d20: 1 + floor(0.5 * 20) = 11
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    game.send({ type: 'roll' }, 'female');
    expect(body(game)).toMatchObject({ kind: 'check', roll: { value: 11, success: true } });
    game.send({ type: 'advance' });
    expect(body(game)).toMatchObject({ kind: 'say', text: 'вийшло' });
    expect(game.state.heroes.female.xp).toBe(10);
    expect(game.state.run?.successes.female).toBe(1);
  });

  it('провал веде гілкою невдачі й XP не дає', () => {
    const game = setup(tiny(check(11)), [0.49]); // 10
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    game.send({ type: 'roll' }, 'female');
    game.send({ type: 'advance' });
    expect(body(game)).toMatchObject({ text: 'не вийшло' });
    expect(game.state.heroes.female.xp).toBe(0);
  });

  it('без кидка рухатись далі не можна', () => {
    const game = setup(tiny(check(5)));
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    expect(game.send({ type: 'advance' })).toHaveProperty('error');
  });

  it('кубик d6 обирає розв’язку за числом', () => {
    const script = tiny([
      {
        kind: 'dice',
        roller: 'male',
        text: 'к',
        outcomes: [
          { min: 1, max: 3, text: 'мало', next: 'low' },
          { min: 4, max: 6, text: 'багато', next: 'high' },
        ],
      },
      { id: 'low', kind: 'say', text: 'low', next: 'end' },
      { id: 'high', kind: 'say', text: 'high', next: 'end' },
    ]);
    const game = setup(script, [0.9]); // 1 + floor(0.9 * 6) = 6
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    game.send({ type: 'roll' }, 'male');
    expect(body(game)).toMatchObject({ roll: 6, outcome: 'багато' });
    game.send({ type: 'advance' });
    expect(body(game)).toMatchObject({ text: 'high' });
  });
});

describe('вибір', () => {
  it('вибирає лише названий герой', () => {
    const script = tiny([
      {
        kind: 'choice',
        chooser: 'male',
        text: 'в',
        options: [
          { label: 'А', next: 'a' },
          { label: 'Б', next: 'b' },
        ],
      },
      { id: 'a', kind: 'say', text: 'a', next: 'end' },
      { id: 'b', kind: 'say', text: 'b', next: 'end' },
    ]);
    const game = setup(script);
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    expect(game.send({ type: 'choose', index: 0 }, 'female')).toHaveProperty('error');
    expect(game.send({ type: 'choose', index: 5 }, 'male')).toHaveProperty('error');
    game.send({ type: 'choose', index: 1 }, 'male');
    expect(body(game)).toMatchObject({ text: 'b' });
  });
});

describe('предмети', () => {
  const ring = { name: 'Кільце', icon: '💍', description: '', effect: 'reroll' as const };
  const amulet = { name: 'Амулет', icon: '🔮', description: '', effect: 'swap' as const };

  it('кільце перекидає кубик і зникає зі скарбниці', () => {
    const script = tiny([
      { kind: 'reward', text: 'р', item: ring },
      { kind: 'check', roller: 'male', label: 'К', text: 'к', difficulty: 15 },
    ]);
    const game = setup(script, [0.0, 0.99]); // 1, потім 20
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    game.send({ type: 'advance' });
    const [item] = game.state.treasury;
    expect(sceneFor(game.state, game.state.script!).usable).toEqual([]);
    game.send({ type: 'roll' }, 'male');
    expect(body(game)).toMatchObject({ roll: { value: 1, success: false } });
    expect(sceneFor(game.state, game.state.script!).usable).toEqual([item.id]);
    game.send({ type: 'use-item', itemId: item.id }, 'female');
    expect(body(game)).toMatchObject({ roll: { value: 20, success: true } });
    expect(game.state.treasury).toHaveLength(0);
  });

  it('амулет передає завдання партнерові один раз', () => {
    const script = tiny([
      { kind: 'reward', text: 'р', item: amulet },
      { kind: 'task', who: 'male', title: 'З', text: 'з' },
    ]);
    const game = setup(script);
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    game.send({ type: 'advance' });
    const [item] = game.state.treasury;
    game.send({ type: 'use-item', itemId: item.id });
    expect(body(game)).toMatchObject({ kind: 'task', who: 'female' });
    expect(game.state.treasury).toHaveLength(0);
  });

  it('не можна використати предмет не до місця', () => {
    const script = tiny([{ kind: 'reward', text: 'р', item: ring }]);
    const game = setup(script);
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    const [item] = game.state.treasury;
    expect(game.send({ type: 'use-item', itemId: item.id })).toHaveProperty('error');
    expect(game.state.treasury).toHaveLength(1);
  });
});

describe('життя, одяг, смерть', () => {
  it('одяг і життя не виходять за межі', () => {
    const script = tiny([
      { kind: 'effect', who: 'male', clothing: -9, text: 'е' },
      { kind: 'effect', who: 'female', hp: 5, text: 'е' },
    ]);
    const game = setup(script);
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    expect(game.state.heroes.male.clothing).toBe(0);
    game.send({ type: 'advance' });
    expect(game.state.heroes.female.hp).toBe(3);
    expect(game.ctx.data.heroes.male.clothing).toBe(0);
  });

  it('герой падає на нулі життя, повертається після кидка й іде далі з того ж місця', () => {
    const script = tiny([
      { kind: 'effect', who: 'female', hp: -3, text: 'е' },
      { kind: 'say', text: 'далі' },
    ]);
    const game = setup(script, [0.9]); // 19 ≥ 8
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    expect(body(game)).toMatchObject({ kind: 'dead', who: 'female', roll: null });
    expect(game.send({ type: 'advance' })).toHaveProperty('error');
    expect(game.send({ type: 'roll' }, 'male')).toHaveProperty('error');
    game.send({ type: 'roll' }, 'female');
    expect(body(game)).toMatchObject({ kind: 'dead', roll: { success: true }, episode: null });
    game.send({ type: 'advance' });
    expect(game.state.heroes.female.hp).toBe(1);
    expect(body(game)).toMatchObject({ kind: 'say', text: 'далі' });
  });

  it('невдалий кидок на повернення дає завдання', () => {
    const script = tiny([{ kind: 'effect', who: 'male', hp: -3, text: 'е' }]);
    const game = setup(script, [0.0, 0.0]);
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    game.send({ type: 'roll' }, 'male');
    expect(body(game)).toMatchObject({ kind: 'dead', roll: { success: false }, episode: { title: 'Р' } });
  });

  it('герой при смерті відновлюється до 1 життя', () => {
    const script = tiny([{ kind: 'effect', who: 'male', hp: -3, text: 'е' }]);
    const game = setup(script, [0.9]);
    game.send({ type: 'start', storyId: 't' });
    game.send({ type: 'advance' });
    game.send({ type: 'roll' }, 'male');
    game.send({ type: 'advance' });
    expect(game.ctx.data.heroes.male.hp).toBe(1);
  });
});

describe('повне проходження справжньої історії', () => {
  function play(seed: number) {
    const ctx = makeCtx({ random: seeded(seed) });
    let state = adventuresModule.init(players, ctx);
    const send = (action: AdvAction, by: 'male' | 'female') => {
      const result = applyAction(state, action, by, ctx);
      if (isFail(result)) throw new Error(`${action.type}: ${result.error}`);
      state = result;
    };
    send({ type: 'start', storyId: SCRIPTS[0].id }, 'male');

    for (let step = 0; step < 3000; step++) {
      const scene = sceneFor(state, state.script!);
      const b = scene.body;
      if (b.kind === 'finish') return { state, ctx, steps: step };
      if (
        scene.usable.length &&
        ((b.kind === 'check' && b.roll && !b.roll.success) || (b.kind === 'dead' && b.roll && !b.roll.success))
      ) {
        send({ type: 'use-item', itemId: scene.usable[0] }, 'male');
        continue;
      }
      if (b.kind === 'choice') send({ type: 'choose', index: step % b.options.length }, b.chooser);
      else if (b.kind === 'check' && !b.roll) send({ type: 'roll' }, b.roller);
      else if (b.kind === 'dice' && b.roll === null) send({ type: 'roll' }, b.roller);
      else if (b.kind === 'dead' && !b.roll) send({ type: 'roll' }, b.who);
      else if (b.kind === 'ritual' && b.roll === null) send({ type: 'roll' }, 'female');
      else if (b.kind === 'wish') send({ type: 'wish', text: 'Масаж на цілий вечір' }, b.winner);
      else send({ type: 'advance' }, 'male');
    }
    throw new Error('історія не завершилась');
  }

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])('seed %i доходить до фіналу', (seed) => {
    const { state, ctx } = play(seed);
    expect(ctx.data.progress).toEqual([{ storyId: SCRIPTS[0].id, chapter: SCRIPTS[0].chapters.length, done: true }]);
    const wishes = ctx.data.treasury.filter((item) => item.kind === 'wish');
    expect(wishes).toHaveLength(1);
    expect(wishes[0].description).toBe('Масаж на цілий вечір');
    expect(state.stories[0].status).toBe('done');
    for (const role of ['male', 'female'] as const) {
      expect(state.heroes[role].hp).toBeGreaterThanOrEqual(1);
      expect(state.heroes[role].level).toBeGreaterThanOrEqual(2);
    }
  });

  it('бажання загадує той, у кого більше вдалих кидків', () => {
    const ctx = makeCtx({ random: seeded(3) });
    let state = adventuresModule.init(players, ctx);
    state = {
      ...state,
      script: SCRIPTS[0],
      run: {
        storyId: SCRIPTS[0].id,
        chapter: 5,
        stage: 'ritual',
        guide: 0,
        index: 0,
        roll: null,
        swapped: false,
        dead: null,
        ritual: 3,
        winner: null,
        successes: { male: 1, female: 4 },
        wish: null,
      },
    };
    const next = applyAction(state, { type: 'advance' }, 'male', ctx);
    if (isFail(next)) throw new Error(next.error);
    expect(next.run).toMatchObject({ stage: 'wish', winner: 'female' });
    expect(applyAction(next, { type: 'wish', text: 'х' }, 'male', ctx)).toHaveProperty('error');
  });

  it('другий гравець бачить ту саму сцену, а партнер у HUD', () => {
    const ctx: AdvCtx = makeCtx();
    const s = adventuresModule.init(players, ctx);
    const view = adventuresModule.viewFor(s, 'female');
    expect(view.hero.name).toBe('Катя');
    expect(view.partner.name).toBe('Дмитро');
  });
});
