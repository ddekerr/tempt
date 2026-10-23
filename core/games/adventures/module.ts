import type { GameModule } from '../../game';
import { ADVENTURES_META } from './meta';
import { summarizeStories } from './story-status';
import { AdvActionSchema, type AdvAction, type AdvCtx, type AdvState, type AdvView } from './types';

/** Свіжий знімок усього, що бачать гравці, із бази. */
function load(names: AdvState['names'], ctx: AdvCtx): AdvState {
  return {
    names,
    stories: summarizeStories(ctx.stories(), ctx.progress()),
    heroes: { male: ctx.hero('male'), female: ctx.hero('female') },
    treasury: ctx.treasury(),
  };
}

export const adventuresModule: GameModule<AdvState, AdvAction, AdvView, AdvCtx> = {
  ...ADVENTURES_META,
  actionSchema: AdvActionSchema,

  init: (players, ctx) => load({ male: players.male.name, female: players.female.name }, ctx),

  reduce: (state, action, _by, ctx) => {
    switch (action.type) {
      case 'refresh':
        return load(state.names, ctx);
    }
  },

  viewFor: (state, role) => ({
    stories: state.stories,
    hero: { ...state.heroes[role], name: state.names[role] },
    treasury: state.treasury,
  }),

  isOver: () => false,
};
