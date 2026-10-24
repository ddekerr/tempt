import type { GameModule } from '../../game';
import { applyAction, sync } from './engine';
import { ADVENTURES_META } from './meta';
import { AdvActionSchema, type AdvAction, type AdvCtx, type AdvState, type AdvView } from './types';
import { sceneFor } from './view';

export const adventuresModule: GameModule<AdvState, AdvAction, AdvView, AdvCtx> = {
  ...ADVENTURES_META,
  actionSchema: AdvActionSchema,

  init: (players, ctx) =>
    sync(
      {
        names: { male: players.male.name, female: players.female.name },
        stories: [],
        heroes: { male: ctx.hero('male'), female: ctx.hero('female') },
        treasury: [],
        run: null,
        script: null,
      },
      ctx,
    ),

  reduce: (state, action, by, ctx) => applyAction(state, action, by, ctx),

  viewFor: (state, role) => {
    const partner = role === 'male' ? 'female' : 'male';
    return {
      stories: state.stories,
      hero: { ...state.heroes[role], name: state.names[role] },
      partner: { ...state.heroes[partner], name: state.names[partner] },
      treasury: state.treasury,
      scene: state.run && state.script ? sceneFor(state, state.script, role) : null,
    };
  },

  isOver: () => false,
};
