import type { GameError, GameModule } from '../../game';
import { partnerOf, type Role } from '../../roles';
import type { Prompt, PromptKind } from './content.schema';
import { TRUTH_OR_DARE_META } from './meta';
import { pickPrompt } from './pick-prompt';
import { TodActionSchema, type TodAction, type TodCtx, type TodState, type TodView } from './types';

const otherKind = (kind: PromptKind): PromptKind => (kind === 'truth' ? 'dare' : 'truth');

/**
 * Дістає запис: спершу той, що ще не виконувався й не випадав у цій грі.
 * Коли весь список пройдено, історія цього списку очищується й починається нове коло.
 */
function draw(
  state: TodState,
  kind: PromptKind,
  role: Role,
  ctx: TodCtx,
): { prompt: Prompt; seen: number[] } | undefined {
  const pool = ctx.pool(kind, role);
  if (pool.length === 0) return undefined;

  const done = new Set(ctx.history.doneIds());
  const seen = new Set(state.seen);
  const fresh = pickPrompt(pool, (item) => !done.has(item.id) && !seen.has(item.id), ctx.random);
  if (fresh) return { prompt: fresh, seen: [...state.seen, fresh.id] };

  const poolIds = new Set(pool.map((item) => item.id));
  ctx.history.clear([...poolIds]);
  const again = pickPrompt(pool, (item) => pool.length === 1 || item.id !== state.prompt?.id, ctx.random);
  if (!again) return undefined;
  return { prompt: again, seen: [...state.seen.filter((id) => !poolIds.has(id)), again.id] };
}

function choose(state: TodState, action: Extract<TodAction, { type: 'choose' }>, ctx: TodCtx): TodState | GameError {
  const random = action.kind === 'random';
  const first: PromptKind = action.kind === 'random' ? (ctx.random() < 0.5 ? 'truth' : 'dare') : action.kind;
  // «Випадково» не зависає, якщо в одному зі списків порожньо: пробуємо другий.
  const order = random ? [first, otherKind(first)] : [first];

  for (const kind of order) {
    const drawn = draw(state, kind, state.turn, ctx);
    if (drawn) return { ...state, phase: 'showing', kind, prompt: drawn.prompt, seen: drawn.seen };
  }
  return { error: 'Немає записів для цього вибору. Додай їх у редакторі.' };
}

export const truthOrDareModule: GameModule<TodState, TodAction, TodView, TodCtx> = {
  ...TRUTH_OR_DARE_META,
  actionSchema: TodActionSchema,

  init: (players, ctx) => ({
    names: { male: players.male.name, female: players.female.name },
    turn: ctx.random() < 0.5 ? 'male' : 'female',
    phase: 'choosing',
    kind: null,
    prompt: null,
    seen: [],
  }),

  reduce: (state, action, by, ctx) => {
    if (by !== state.turn) return { error: 'Зараз не твоя черга' };

    switch (action.type) {
      case 'choose':
        if (state.phase !== 'choosing') return { error: 'Запис уже обрано' };
        return choose(state, action, ctx);

      case 'reroll': {
        if (state.phase !== 'showing' || !state.kind) return { error: 'Нічого оновлювати' };
        if (ctx.pool(state.kind, by).length < 2) return { error: 'Інших записів немає' };
        const drawn = draw(state, state.kind, by, ctx);
        if (!drawn) return { error: 'Інших записів немає' };
        return { ...state, prompt: drawn.prompt, seen: drawn.seen };
      }

      case 'done':
        if (state.phase !== 'showing' || !state.prompt) return { error: 'Нічого завершувати' };
        ctx.history.record(state.prompt.id);
        return { ...state, turn: partnerOf(by), phase: 'choosing', kind: null, prompt: null };
    }
  },

  viewFor: (state, role) => {
    if (role !== state.turn) return { mode: 'watching', name: state.names[state.turn] };
    if (state.phase === 'showing' && state.kind && state.prompt) {
      return { mode: 'showing', kind: state.kind, text: state.prompt.text };
    }
    return { mode: 'choosing' };
  },

  isOver: () => false,
};
