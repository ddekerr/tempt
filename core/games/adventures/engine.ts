import type { GameError } from '../../game';
import type { Role } from '../../roles';
import type { Chapter, StoryNode, StoryScript } from './script.types';
import { summarizeStories } from './story-status';
import {
  HERO_CLOTHING_MAX,
  HERO_HP_MAX,
  RESURRECT_DIFFICULTY,
  levelForXp,
  type AdvAction,
  type AdvCtx,
  type AdvState,
  type Hero,
  type Penalty,
  type Run,
} from './types';

export const XP_CHECK = 10;
export const XP_CHAPTER = 20;
export const XP_STORY = 40;

type Result = AdvState | GameError;

const fail = (error: string): GameError => ({ error });
export const isFail = (value: unknown): value is GameError =>
  typeof value === 'object' && value !== null && 'error' in value;
export const partnerOf = (role: Role): Role => (role === 'male' ? 'female' : 'male');
const roll = (ctx: AdvCtx, sides: number) => 1 + Math.floor(ctx.random() * sides);
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const chapterOf = (script: StoryScript, run: Run): Chapter => script.chapters[run.chapter - 1];
export const nodeOf = (script: StoryScript, run: Run): StoryNode => chapterOf(script, run).nodes[run.index];

/** Хто бачить текст завдання: той, хто кидав кубик або робив вибір. Без нього: виконавець завдання. */
export function readerOf(script: StoryScript, run: Run): Role {
  if (run.stage === 'ritual') return run.lastActor ?? 'male';
  if (run.dead) return run.dead.who;
  const node = nodeOf(script, run);
  const fallback = node.kind === 'task' && node.who !== 'both' ? node.who : 'male';
  return run.lastActor ?? fallback;
}

/** Свіжий знімок того, що живе в базі. Стан гри (run) лишається як є. */
export function sync(state: AdvState, ctx: AdvCtx): AdvState {
  return {
    ...state,
    stories: summarizeStories(ctx.stories(), ctx.progress()),
    heroes: { male: ctx.hero('male'), female: ctx.hero('female') },
    treasury: ctx.treasury(),
  };
}

function patchHero(state: AdvState, ctx: AdvCtx, role: Role, change: (hero: Hero) => Hero): AdvState {
  const hero = change(state.heroes[role]);
  ctx.saveHero(role, hero);
  return { ...state, heroes: { ...state.heroes, [role]: hero } };
}

function gainXp(state: AdvState, ctx: AdvCtx, role: Role, amount: number): AdvState {
  return patchHero(state, ctx, role, (hero) => {
    const xp = hero.xp + amount;
    return { ...hero, xp, level: levelForXp(xp) };
  });
}

function withRun(state: AdvState, run: Run): AdvState {
  return { ...state, run };
}

function indexOfTarget(chapter: Chapter, target: string): number {
  const found = chapter.nodes.findIndex((node) => node.id === target);
  if (found < 0) throw new Error(`Вузол «${target}» не знайдено`);
  return found;
}

/** Куди йти після вузла. -1: глава закінчилась. */
function nextIndex(chapter: Chapter, index: number, override?: string): number {
  const target = override ?? chapter.nodes[index].next;
  if (target === 'end') return -1;
  if (target !== undefined) return indexOfTarget(chapter, target);
  return index + 1 < chapter.nodes.length ? index + 1 : -1;
}

const noPenalty = (state: AdvState) => ({
  run: state.run!,
  penalty: null as Penalty | null,
  lostItem: null as string | null,
});

/**
 * Штраф, коли втрачати вже нічого: до кінця глави завдання виконуються із заплющеними очима,
 * найближча перевірка складніша на 1 або зі скарбниці зникає один предмет. Що саме, вирішує випадок.
 */
function applyPenalty(state: AdvState, ctx: AdvCtx, who: Role) {
  const run = state.run!;
  const items = state.treasury.filter((item) => item.kind === 'item');
  const options: Penalty[] = ['harder'];
  if (!run.blind.includes(who)) options.push('blind');
  if (items.length > 0) options.push('item');

  const penalty = options[Math.floor(ctx.random() * options.length)];
  if (penalty === 'blind') return { run: { ...run, blind: [...run.blind, who] }, penalty, lostItem: null };
  if (penalty === 'harder') return { run: { ...run, harder: run.harder + 1 }, penalty, lostItem: null };

  const lost = items[Math.floor(ctx.random() * items.length)];
  ctx.removeTreasure(lost.id);
  return { run, penalty, lostItem: lost.name };
}

/** Входить у вузол: тут одразу діють наслідки (втрата одягу, нагорода). */
function enter(state: AdvState, ctx: AdvCtx, script: StoryScript, run: Run, index: number): AdvState {
  let next: AdvState = withRun(state, {
    ...run,
    stage: 'play',
    index,
    roll: null,
    swapped: false,
    applied: null,
    dead: null,
  });
  const node = chapterOf(script, run).nodes[index];

  if (node.kind === 'effect') {
    const hero = state.heroes[node.who];
    const wantClothing = node.clothing ?? 0;
    const clothing = clamp(hero.clothing + wantClothing, 0, HERO_CLOTHING_MAX);
    const hp = clamp(hero.hp + (node.hp ?? 0), 0, HERO_HP_MAX);

    next = patchHero(next, ctx, node.who, (current) => ({ ...current, hp, clothing }));
    // Одягу вже не вистачає, а втрата настала: замість життя герой платить умовою гри.
    const lacking = wantClothing < 0 && hero.clothing < -wantClothing;
    const { run: afterPenalty, lostItem, penalty } = lacking ? applyPenalty(next, ctx, node.who) : noPenalty(next);
    next = withRun(lostItem ? sync(next, ctx) : next, {
      ...afterPenalty,
      applied: { hp: hp - hero.hp, clothing: clothing - hero.clothing, penalty, lostItem },
    });
    if (hp === 0 && hp < hero.hp) {
      next = withRun(next, { ...next.run!, dead: { who: node.who, roll: null, episode: null } });
    }
  }

  if (node.kind === 'reward') {
    ctx.addTreasure({
      kind: 'item',
      name: node.item.name,
      icon: node.item.icon,
      description: node.item.description,
      effect: node.item.effect ?? null,
    });
    next = sync(next, ctx);
  }

  return next;
}

function enterChapter(state: AdvState, ctx: AdvCtx, script: StoryScript, run: Run): AdvState {
  const saved = ctx.progress().find((item) => item.storyId === run.storyId);
  ctx.saveProgress({ storyId: run.storyId, chapter: run.chapter, done: saved?.done ?? false });
  return enter(sync(state, ctx), ctx, script, { ...run, blind: [], harder: 0, lastActor: null }, 0);
}

function endChapter(state: AdvState, ctx: AdvCtx, script: StoryScript, run: Run): AdvState {
  let next = state;
  for (const role of ['male', 'female'] as const) next = gainXp(next, ctx, role, XP_CHAPTER);

  if (run.chapter >= script.chapters.length) {
    return withRun(next, { ...run, stage: 'ritual', roll: null, ritual: null });
  }

  // Життя між главами не повертається: лише воскресіння й початок історії.
  return enterChapter(next, ctx, script, { ...run, chapter: run.chapter + 1 });
}

function goTo(state: AdvState, ctx: AdvCtx, script: StoryScript, run: Run, index: number): AdvState {
  return index < 0 ? endChapter(state, ctx, script, run) : enter(state, ctx, script, run, index);
}

/** Які предмети зі скарбниці придатні просто зараз. */
export function usableItems(state: AdvState, script: StoryScript): number[] {
  const run = state.run;
  if (!run || run.stage !== 'play') return [];
  const node = nodeOf(script, run);

  const canReroll = run.dead
    ? run.dead.roll !== null
    : (node.kind === 'check' || node.kind === 'dice') && run.roll !== null;
  const canWard = !run.dead && (run.blind.length > 0 || run.harder > 0);
  const canSwap = !run.dead && node.kind === 'task' && node.who !== 'both' && !run.swapped;

  return state.treasury
    .filter(
      (item) =>
        (item.effect === 'reroll' && canReroll) ||
        (item.effect === 'swap' && canSwap) ||
        (item.effect === 'ward' && canWard),
    )
    .map((item) => item.id);
}

export function beginRun(state: AdvState, ctx: AdvCtx, storyId: string, fromStart: boolean): Result {
  if (state.run) return fail('Історія вже триває.');
  const summary = state.stories.find((story) => story.id === storyId);
  const script = ctx.script(storyId);
  if (!summary || !script) return fail('Такої історії немає.');
  if (summary.status === 'locked') return fail('Ця історія ще закрита.');

  const resume = summary.status === 'started' && !fromStart;
  const chapter = resume ? summary.chapter : 1;
  const run: Run = {
    storyId,
    chapter,
    stage: 'play',
    index: 0,
    roll: null,
    swapped: false,
    applied: null,
    blind: [],
    harder: 0,
    lastActor: null,
    dead: null,
    ritual: null,
    winner: null,
    successes: { male: 0, female: 0 },
    wish: null,
  };

  let next: AdvState = { ...state, script };
  if (chapter === 1) {
    for (const role of ['male', 'female'] as const) {
      next = patchHero(next, ctx, role, (hero) => ({ ...hero, hp: HERO_HP_MAX, clothing: HERO_CLOTHING_MAX }));
    }
  }

  return enterChapter(next, ctx, script, run);
}

export function applyAction(state: AdvState, action: AdvAction, by: Role, ctx: AdvCtx): Result {
  switch (action.type) {
    case 'refresh':
      return sync(state, ctx);
    case 'start':
      return beginRun(state, ctx, action.storyId, action.fromStart ?? false);
    case 'leave':
      return sync({ ...state, run: null, script: null }, ctx);
  }

  const run = state.run;
  if (!run) return fail('Історію не розпочато.');
  const script = ctx.script(run.storyId);
  if (!script) return fail('Такої історії немає.');

  switch (action.type) {
    case 'advance':
      return advance(state, ctx, script, run, by);
    case 'choose':
      return choose(state, ctx, script, run, by, action.index);
    case 'roll':
      return rollDice(state, ctx, script, run, by);
    case 'use-item':
      return useItem(state, ctx, script, run, action.itemId);
    case 'wish':
      return makeWish(state, ctx, script, run, by, action.text);
  }
}

function advance(state: AdvState, ctx: AdvCtx, script: StoryScript, run: Run, by: Role): Result {
  if (run.stage === 'ritual') {
    if (run.ritual === null) return fail('Спершу киньте кубик.');
    if (by !== readerOf(script, run)) return fail('Ритуал читає той, хто кидав кубик.');
    const { male, female } = run.successes;
    const winner: Role = male === female ? (ctx.random() < 0.5 ? 'male' : 'female') : male > female ? 'male' : 'female';
    return withRun(state, { ...run, stage: 'wish', winner });
  }

  if (run.stage !== 'play') return fail('Тут немає куди рухатись.');

  let current = state;
  let live = run;
  if (run.dead) {
    if (!run.dead.roll) return fail('Спершу кидок на повернення.');
    if (run.dead.episode !== null && by !== run.dead.who)
      return fail('Завдання повернення бачить той, хто кидав кубик.');
    current = patchHero(state, ctx, run.dead.who, (hero) => ({ ...hero, hp: 1 }));
    live = { ...run, dead: null };
    current = withRun(current, live);
  }

  const chapter = chapterOf(script, live);
  const node = chapter.nodes[live.index];
  if (node.kind === 'task' && !run.dead && by !== readerOf(script, live)) {
    return fail('Завдання читає той, хто кидав кубик.');
  }

  switch (node.kind) {
    case 'choice':
      return fail('Тут треба вибрати.');
    case 'check': {
      if (!live.roll) return fail('Спершу кидок.');
      if (live.roll.success) {
        current = gainXp(current, ctx, node.roller, XP_CHECK);
        live = { ...live, successes: { ...live.successes, [node.roller]: live.successes[node.roller] + 1 } };
      }
      live = { ...live, harder: 0 };
      const override = live.roll.success ? node.onSuccess : node.onFail;
      return goTo(current, ctx, script, live, nextIndex(chapter, live.index, override));
    }
    case 'dice': {
      if (!live.roll) return fail('Спершу кидок.');
      const value = live.roll.value;
      const outcome = node.outcomes.find((item) => value >= item.min && value <= item.max);
      if (!outcome) return fail('Для цього числа немає розв’язки.');
      return goTo(current, ctx, script, live, nextIndex(chapter, live.index, outcome.next));
    }
    default:
      return goTo(current, ctx, script, live, nextIndex(chapter, live.index));
  }
}

function choose(state: AdvState, ctx: AdvCtx, script: StoryScript, run: Run, by: Role, index: number): Result {
  if (run.stage !== 'play' || run.dead) return fail('Зараз вибирати нема з чого.');
  const chapter = chapterOf(script, run);
  const node = chapter.nodes[run.index];
  if (node.kind !== 'choice') return fail('Зараз вибирати нема з чого.');
  if (by !== node.chooser) return fail('Вибирає партнер.');
  const option = node.options[index];
  if (!option) return fail('Такого варіанта немає.');
  return goTo(state, ctx, script, { ...run, lastActor: by }, nextIndex(chapter, run.index, option.next));
}

function rollDice(state: AdvState, ctx: AdvCtx, script: StoryScript, run: Run, by: Role): Result {
  if (run.stage === 'ritual') {
    if (run.ritual !== null) return fail('Кубик уже кинуто.');
    return withRun(state, { ...run, ritual: roll(ctx, 6), lastActor: by });
  }
  if (run.stage !== 'play') return fail('Зараз кидати нічого.');

  if (run.dead) {
    if (by !== run.dead.who) return fail('Кидає той, хто впав.');
    if (run.dead.roll) return fail('Кубик уже кинуто.');
    return withRun(state, { ...run, dead: deadRoll(run.dead.who, script, ctx), lastActor: by });
  }

  const node = nodeOf(script, run);
  if (node.kind !== 'check' && node.kind !== 'dice') return fail('Зараз кидати нічого.');
  if (by !== node.roller) return fail('Кидає партнер.');
  if (run.roll) return fail('Кубик уже кинуто.');
  return withRun(state, { ...run, roll: rollFor(node, ctx, run.harder), lastActor: by });
}

function rollFor(node: StoryNode, ctx: AdvCtx, harder: number): Run['roll'] {
  if (node.kind === 'check') {
    const value = roll(ctx, 20);
    return { value, success: value >= node.difficulty + harder };
  }
  return { value: roll(ctx, 6), success: true };
}

function deadRoll(who: Role, script: StoryScript, ctx: AdvCtx): NonNullable<Run['dead']> {
  const value = roll(ctx, 20);
  const success = value >= RESURRECT_DIFFICULTY;
  const episode = success ? null : Math.floor(ctx.random() * script.resurrection.length);
  return { who, roll: { value, success }, episode };
}

function useItem(state: AdvState, ctx: AdvCtx, script: StoryScript, run: Run, itemId: number): Result {
  if (!usableItems(state, script).includes(itemId)) return fail('Цей предмет зараз не допоможе.');
  const item = state.treasury.find((entry) => entry.id === itemId)!;
  ctx.removeTreasure(itemId);
  const next = sync(state, ctx);

  if (item.effect === 'swap') return withRun(next, { ...run, swapped: true });
  if (item.effect === 'ward') return withRun(next, { ...run, blind: [], harder: 0 });

  if (run.dead) return withRun(next, { ...run, dead: deadRoll(run.dead.who, script, ctx) });
  return withRun(next, { ...run, roll: rollFor(nodeOf(script, run), ctx, run.harder) });
}

function makeWish(state: AdvState, ctx: AdvCtx, script: StoryScript, run: Run, by: Role, text: string): Result {
  if (run.stage !== 'wish') return fail('Бажання загадують наприкінці.');
  if (by !== run.winner) return fail('Бажання загадує партнер.');

  ctx.addTreasure({
    kind: 'wish',
    name: `Бажання від ${state.names[by]}`,
    icon: '🕯️',
    description: text,
    effect: null,
  });
  ctx.saveProgress({ storyId: run.storyId, chapter: script.chapters.length, done: true });

  let next = sync(state, ctx);
  for (const role of ['male', 'female'] as const) next = gainXp(next, ctx, role, XP_STORY);
  return withRun(sync(next, ctx), { ...run, stage: 'finish', wish: text });
}
