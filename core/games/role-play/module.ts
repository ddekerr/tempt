import type { GameError, GameModule } from '../../game';
import { partnerOf } from '../../roles';
import type { Scenario } from './content.schema';
import { ROLE_PLAY_META } from './meta';
import { RpActionSchema, type RpAction, type RpCtx, type RpState, type RpView } from './types';

function start(state: RpState, scenario: Scenario, seen: number[]): RpState {
  return { ...state, phase: 'playing', scenario, seen };
}

function pickRandom(state: RpState, intensity: Extract<RpAction, { type: 'random' }>['intensity'], ctx: RpCtx) {
  const pool = state.catalog.filter((item) => !intensity || item.intensity === intensity);
  if (pool.length === 0) return { error: 'Немає сценаріїв для цього вибору. Додай їх у редакторі.' } as GameError;

  const seen = new Set(state.seen);
  const fresh = pool.filter((item) => !seen.has(item.id));
  const source = fresh.length > 0 ? fresh : pool;
  const picked = source[Math.min(Math.floor(ctx.random() * source.length), source.length - 1)];

  const scenario = ctx.scenario(picked.id);
  if (!scenario) return { error: 'Сценарій не знайдено' } as GameError;
  // коли всі вже були, починаємо нове коло
  return start(state, scenario, fresh.length > 0 ? [...state.seen, picked.id] : [picked.id]);
}

export const rolePlayModule: GameModule<RpState, RpAction, RpView, RpCtx> = {
  ...ROLE_PLAY_META,
  actionSchema: RpActionSchema,

  init: (players, ctx) => ({
    names: { male: players.male.name, female: players.female.name },
    phase: 'choosing',
    catalog: ctx.catalog(),
    scenario: null,
    seen: [],
  }),

  reduce: (state, action, _by, ctx) => {
    switch (action.type) {
      case 'pick': {
        if (state.phase !== 'choosing') return { error: 'Сценарій уже обрано' };
        const scenario = ctx.scenario(action.scenarioId);
        if (!scenario) return { error: 'Сценарій не знайдено' };
        return start(state, scenario, [...state.seen.filter((id) => id !== scenario.id), scenario.id]);
      }

      case 'random':
        if (state.phase !== 'choosing') return { error: 'Сценарій уже обрано' };
        return pickRandom(state, action.intensity, ctx);

      case 'back':
        if (state.phase !== 'playing') return { error: 'Нічого повертати' };
        return { ...state, phase: 'choosing', scenario: null, catalog: ctx.catalog() };
    }
  },

  viewFor: (state, role) => {
    const { scenario } = state;
    if (state.phase === 'playing' && scenario) {
      return {
        mode: 'playing',
        scenarioId: scenario.id,
        title: scenario.title,
        intensity: scenario.intensity,
        partnerRoleName: scenario[partnerOf(role)].roleName,
        role: scenario[role],
      };
    }
    return { mode: 'choosing', catalog: state.catalog };
  },

  isOver: () => false,
};
