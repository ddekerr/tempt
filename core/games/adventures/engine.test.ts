import { describe, expect, it } from 'vitest';
import { applyAction, isFail, readerOf } from './engine';
import { adventuresModule } from './module';
import type { Chapter, StoryScript } from './script.types';
import { makeCtx, seeded } from './memory-ctx';
import type { AdvAction, AdvState } from './types';
import { sceneFor } from './view';

const players = { male: { name: 'Дмитро' }, female: { name: 'Катя' } };

/** Крихітна історія з трьох сцен, щоб перевіряти правила окремо від справжнього тексту. */
function tiny(nodes: Chapter['nodes']): StoryScript {
  return {
    id: 't',
    title: 'Тест',
    description: '',
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
    /** Рухає далі від імені того, хто читає поточну сцену (завдання бачить лише він). */
    next: () => send({ type: 'advance' }, state.run ? readerOf(script, state.run) : 'male'),
    get state() {
      return state;
    },
  };
}

const body = (game: { state: AdvState }) => sceneFor(game.state, game.state.script!, 'male').body;

describe('старт і вихід', () => {
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
    game.next();
    expect(game.send({ type: 'roll' }, 'male')).toHaveProperty('error');
    expect(game.send({ type: 'roll' }, 'female')).not.toHaveProperty('error');
    expect(game.send({ type: 'roll' }, 'female')).toHaveProperty('error');
  });

  it('успіх, коли випало не менше за складність, дає XP і вдалий кидок', () => {
    const game = setup(tiny(check(11)), [0.5]); // d20: 1 + floor(0.5 * 20) = 11
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.send({ type: 'roll' }, 'female');
    expect(body(game)).toMatchObject({ kind: 'check', roll: { value: 11, success: true } });
    game.next();
    expect(body(game)).toMatchObject({ kind: 'say', text: 'вийшло' });
    expect(game.state.heroes.female.xp).toBe(10);
    expect(game.state.run?.successes.female).toBe(1);
  });

  it('провал веде гілкою невдачі й XP не дає', () => {
    const game = setup(tiny(check(11)), [0.49]); // 10
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.send({ type: 'roll' }, 'female');
    game.next();
    expect(body(game)).toMatchObject({ text: 'не вийшло' });
    expect(game.state.heroes.female.xp).toBe(0);
  });

  it('без кидка рухатись далі не можна', () => {
    const game = setup(tiny(check(5)));
    game.send({ type: 'start', storyId: 't' });
    game.next();
    expect(game.next()).toHaveProperty('error');
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
    game.next();
    game.send({ type: 'roll' }, 'male');
    expect(body(game)).toMatchObject({ roll: 6, outcome: 'багато' });
    game.next();
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
    game.next();
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
    game.next();
    game.next();
    const [item] = game.state.treasury;
    expect(sceneFor(game.state, game.state.script!, 'male').usable).toEqual([]);
    game.send({ type: 'roll' }, 'male');
    expect(body(game)).toMatchObject({ roll: { value: 1, success: false } });
    expect(sceneFor(game.state, game.state.script!, 'male').usable).toEqual([item.id]);
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
    game.next();
    game.next();
    const [item] = game.state.treasury;
    game.send({ type: 'use-item', itemId: item.id });
    expect(body(game)).toMatchObject({ kind: 'task', who: 'female' });
    expect(game.state.treasury).toHaveLength(0);
  });

  it('не можна використати предмет не до місця', () => {
    const script = tiny([{ kind: 'reward', text: 'р', item: ring }]);
    const game = setup(script);
    game.send({ type: 'start', storyId: 't' });
    game.next();
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
    game.next();
    expect(game.state.heroes.male.clothing).toBe(0);
    game.next();
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
    game.next();
    expect(body(game)).toMatchObject({ kind: 'dead', who: 'female', roll: null });
    expect(game.next()).toHaveProperty('error');
    expect(game.send({ type: 'roll' }, 'male')).toHaveProperty('error');
    game.send({ type: 'roll' }, 'female');
    expect(body(game)).toMatchObject({ kind: 'dead', roll: { success: true }, episode: null });
    game.next();
    expect(game.state.heroes.female.hp).toBe(1);
    expect(body(game)).toMatchObject({ kind: 'say', text: 'далі' });
  });

  it('невдалий кидок на повернення дає завдання', () => {
    const script = tiny([{ kind: 'effect', who: 'male', hp: -3, text: 'е' }]);
    const game = setup(script, [0.0, 0.0]);
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.send({ type: 'roll' }, 'male');
    expect(body(game)).toMatchObject({ kind: 'dead', roll: { success: false }, episode: { title: 'Р' } });
  });

  it('герой при смерті відновлюється до 1 життя', () => {
    const script = tiny([{ kind: 'effect', who: 'male', hp: -3, text: 'е' }]);
    const game = setup(script, [0.9]);
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.send({ type: 'roll' }, 'male');
    game.next();
    expect(game.ctx.data.heroes.male.hp).toBe(1);
  });
});

describe('хто бачить завдання', () => {
  const script = tiny([
    { kind: 'check', roller: 'female', label: 'К', text: 'к', difficulty: 2 },
    { kind: 'task', who: 'both', title: 'Секрет', text: 'що робити', timer: 30 },
  ]);

  const toTask = () => {
    const game = setup(script, [0.99]);
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.send({ type: 'roll' }, 'female');
    game.next();
    return game;
  };

  it('текст бачить лише той, хто кидав кубик; другому телефону він не передається', () => {
    const game = toTask();
    const mine = sceneFor(game.state, game.state.script!, 'female');
    const theirs = sceneFor(game.state, game.state.script!, 'male');

    expect(mine.body).toMatchObject({ kind: 'task', hidden: false, title: 'Секрет', text: 'що робити', timer: 30 });
    expect(theirs.body).toMatchObject({ kind: 'task', hidden: true, title: '', text: '', reader: 'female' });
    expect(JSON.stringify(theirs)).not.toContain('що робити');
    expect(mine.actor).toBe('female');
  });

  it('завершити завдання може лише той, хто його читає', () => {
    const game = toTask();
    expect(game.send({ type: 'advance' }, 'male')).toHaveProperty('error');
    expect(game.send({ type: 'advance' }, 'female')).not.toHaveProperty('error');
  });

  it('завдання після вибору читає той, хто вибирав', () => {
    const choose = tiny([
      {
        kind: 'choice',
        chooser: 'female',
        text: 'в',
        options: [
          { label: 'А', next: 'a' },
          { label: 'Б', next: 'a' },
        ],
      },
      { id: 'a', kind: 'task', who: 'male', title: 'З', text: 'з' },
    ]);
    const game = setup(choose);
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.send({ type: 'choose', index: 0 }, 'female');
    expect(sceneFor(game.state, game.state.script!, 'female').body).toMatchObject({ hidden: false, reader: 'female' });
    expect(sceneFor(game.state, game.state.script!, 'male').body).toMatchObject({ hidden: true });
  });

  it('завдання повернення після смерті бачить лише той, хто кидав кубик на повернення', () => {
    const dead = tiny([{ kind: 'effect', who: 'male', hp: -3, text: 'е' }]);
    const game = setup(dead, [0.0, 0.0]);
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.send({ type: 'roll' }, 'male');
    expect(sceneFor(game.state, game.state.script!, 'male').body).toMatchObject({
      episodeHidden: false,
      episode: { title: 'Р' },
    });
    const partner = sceneFor(game.state, game.state.script!, 'female').body;
    expect(partner).toMatchObject({ kind: 'dead', episodeHidden: true, episode: null });
    expect(game.send({ type: 'advance' }, 'female')).toHaveProperty('error');
    expect(game.send({ type: 'advance' }, 'male')).not.toHaveProperty('error');
  });
});

describe('штраф, коли одягу вже не лишилось', () => {
  const lose = (count: number, who: 'male' | 'female' = 'male') =>
    ({ kind: 'effect', who, clothing: -count, text: 'е' }) as const;

  it('жодного штрафу, поки одягу вистачає', () => {
    const game = setup(tiny([lose(2)]));
    game.send({ type: 'start', storyId: 't' });
    game.next();
    expect(body(game)).toMatchObject({ kind: 'effect', clothing: -2, penalty: null });
    expect(game.state.heroes.male).toMatchObject({ clothing: 3, hp: 3 });
  });

  it('життя не страждає, а штраф «складніша перевірка» діє на найближчу перевірку й зникає', () => {
    // варіанти штрафу: ['harder', 'blind'] (у скарбниці порожньо); випадкове 0 → 'harder', далі кидок d20 = 11
    const script = tiny([
      lose(5),
      lose(1),
      { kind: 'check', roller: 'male', label: 'К', text: 'к', difficulty: 11 },
      { kind: 'check', roller: 'male', label: 'К', text: 'к', difficulty: 11 },
    ]);
    const game = setup(script, [0, 0.5]);
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.next();
    expect(body(game)).toMatchObject({ kind: 'effect', penalty: 'harder', hp: 0, clothing: 0 });
    expect(game.state.heroes.male.hp).toBe(3);

    game.next();
    expect(body(game)).toMatchObject({ kind: 'check', difficulty: 12, harder: 1 });
    game.send({ type: 'roll' }, 'male'); // d20: 11 при складності 12, провал
    expect(body(game)).toMatchObject({ roll: { value: 11, success: false } });
    game.next();
    expect(body(game)).toMatchObject({ kind: 'check', difficulty: 11, harder: 0 });
  });

  it('штраф «заплющені очі» тримається до кінця глави й видно в завданнях героя', () => {
    // варіанти штрафу: ['harder', 'blind']; випадкове 0.99 → 'blind'
    const script = tiny([
      lose(5),
      lose(1),
      { kind: 'task', who: 'male', title: 'З', text: 'з' },
      { kind: 'task', who: 'female', title: 'З', text: 'з' },
      { kind: 'task', who: 'both', title: 'З', text: 'з' },
    ]);
    const game = setup(script, [0.99]);
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.next();
    expect(body(game)).toMatchObject({ penalty: 'blind' });
    game.next();
    expect(body(game)).toMatchObject({ kind: 'task', who: 'male', blind: ['male'] });
    game.next();
    expect(body(game)).toMatchObject({ kind: 'task', who: 'female', blind: [] });
    game.next();
    expect(body(game)).toMatchObject({ kind: 'task', who: 'both', blind: ['male'] });
  });

  it('штраф «втратити предмет» забирає предмет зі скарбниці', () => {
    // options: ['harder', 'blind', 'item'], випадкове 0.99 → 'item'; другий виклик вибирає предмет
    const script = tiny([
      { kind: 'reward', text: 'р', item: { name: 'Прикраса', icon: '💎', description: 'д', effect: 'reroll' } },
      lose(5),
      lose(1),
    ]);
    const game = setup(script, [0.99, 0]);
    game.send({ type: 'start', storyId: 't' });
    game.next();
    game.next();
    expect(game.state.treasury).toHaveLength(1);
    game.next();
    expect(body(game)).toMatchObject({ kind: 'effect', penalty: 'item', lostItem: 'Прикраса' });
    expect(game.state.treasury).toHaveLength(0);
  });

  it('втрата життя в сцені доводить до падіння', () => {
    const game = setup(tiny([{ kind: 'effect', who: 'male', hp: -3, text: 'е' }]));
    game.send({ type: 'start', storyId: 't' });
    game.next();
    expect(body(game)).toMatchObject({ kind: 'dead', who: 'male' });
  });
});

describe('срібна маска', () => {
  const ward = { name: 'Маска', icon: '🎭', description: 'д', effect: 'ward' as const };

  it('знімає накопичені штрафи й зникає, а без штрафів марна', () => {
    const script = tiny([
      { kind: 'reward', text: 'р', item: ward },
      { kind: 'effect', who: 'male', clothing: -5, text: 'а' },
      { kind: 'effect', who: 'male', clothing: -1, text: 'б' },
      { kind: 'check', roller: 'male', label: 'К', text: 'к', difficulty: 5 },
    ]);
    // перший ctx.random() обирає штраф (['harder', 'blind', 'item']), 0 → «складніше»
    const game = setup(script, [0]);
    game.send({ type: 'start', storyId: 't' });
    game.next();
    const [mask] = game.state.treasury;
    expect(game.send({ type: 'use-item', itemId: mask.id })).toHaveProperty('error');
    game.next();
    game.next();
    expect(game.state.run?.harder).toBe(1);
    game.send({ type: 'use-item', itemId: mask.id });
    expect(game.state.run).toMatchObject({ harder: 0, blind: [] });
    expect(game.state.treasury).toHaveLength(0);
  });
});

describe('фінал і бажання', () => {
  it('бажання загадує той, у кого більше вдалих кидків', () => {
    const script = tiny([]);
    const ctx = makeCtx({ scripts: [script], random: seeded(3) });
    let state = adventuresModule.init(players, ctx);
    state = {
      ...state,
      script,
      run: {
        storyId: 't',
        chapter: 1,
        stage: 'ritual',
        index: 0,
        roll: null,
        swapped: false,
        applied: null,
        blind: [],
        harder: 0,
        lastActor: null,
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

    const done = applyAction(next, { type: 'wish', text: 'Масаж' }, 'female', ctx);
    if (isFail(done)) throw new Error(done.error);
    expect(done.run?.stage).toBe('finish');
    expect(ctx.data.treasury.map((item) => [item.kind, item.description])).toEqual([['wish', 'Масаж']]);
    expect(ctx.data.progress).toEqual([{ storyId: 't', chapter: 1, done: true }]);
  });

  it('кожен бачить себе й партнера', () => {
    const view = adventuresModule.viewFor(adventuresModule.init(players, makeCtx()), 'female');
    expect(view.hero.name).toBe('Катя');
    expect(view.partner.name).toBe('Дмитро');
  });
});
