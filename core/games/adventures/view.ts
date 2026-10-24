import type { Role } from '../../roles';
import type { StoryScript } from './script.types';
import { nodeOf, partnerOf, readerOf, usableItems } from './engine';
import { RESURRECT_DIFFICULTY, type AdvState, type SceneBody, type SceneView } from './types';

/** Підставляє імена гравців у текст сценарію. */
export const fill = (text: string, names: Record<Role, string>): string =>
  text.replaceAll('{male}', names.male).replaceAll('{female}', names.female);

function bodyFor(state: AdvState, script: StoryScript, viewer: Role): { body: SceneBody; actor: Role | 'any' } {
  const run = state.run!;
  const f = (text: string) => fill(text, state.names);

  if (run.stage === 'ritual') {
    const reader = run.ritual === null ? null : readerOf(script, run);
    const episode = run.ritual === null ? null : script.ritual[run.ritual - 1];
    const hidden = episode !== null && viewer !== reader;
    return {
      body: {
        kind: 'ritual',
        roll: run.ritual,
        reader,
        episodeHidden: hidden,
        episode: episode && !hidden ? { ...episode, title: f(episode.title), text: f(episode.text) } : null,
      },
      actor: reader ?? 'any',
    };
  }

  if (run.stage === 'wish') {
    return { body: { kind: 'wish', winner: run.winner!, successes: run.successes }, actor: run.winner! };
  }

  if (run.stage === 'finish') {
    return { body: { kind: 'finish', text: f(script.epilogue), wish: run.wish }, actor: 'any' };
  }

  if (run.dead) {
    const episode = run.dead.episode === null ? null : script.resurrection[run.dead.episode];
    const hidden = episode !== null && viewer !== run.dead.who;
    return {
      body: {
        kind: 'dead',
        who: run.dead.who,
        difficulty: RESURRECT_DIFFICULTY,
        roll: run.dead.roll,
        episodeHidden: hidden,
        episode: episode && !hidden ? { ...episode, title: f(episode.title), text: f(episode.text) } : null,
      },
      actor: run.dead.roll ? (episode ? run.dead.who : 'any') : run.dead.who,
    };
  }

  const node = nodeOf(script, run);
  switch (node.kind) {
    case 'title':
      return { body: { kind: 'title', title: f(node.title), text: f(node.text) }, actor: 'any' };
    case 'say':
      return { body: { kind: 'say', speaker: node.speaker && f(node.speaker), text: f(node.text) }, actor: 'any' };
    case 'choice':
      return {
        body: {
          kind: 'choice',
          text: f(node.text),
          chooser: node.chooser,
          options: node.options.map((o) => f(o.label)),
        },
        actor: node.chooser,
      };
    case 'check':
      return {
        body: {
          kind: 'check',
          text: f(node.text),
          label: f(node.label),
          difficulty: node.difficulty + run.harder,
          harder: run.harder,
          roller: node.roller,
          roll: run.roll,
        },
        actor: run.roll ? 'any' : node.roller,
      };
    case 'dice': {
      const outcome = run.roll ? node.outcomes.find((o) => run.roll!.value >= o.min && run.roll!.value <= o.max) : null;
      return {
        body: {
          kind: 'dice',
          text: f(node.text),
          roller: node.roller,
          roll: run.roll?.value ?? null,
          outcome: outcome ? f(outcome.text) : null,
        },
        actor: run.roll ? 'any' : node.roller,
      };
    }
    case 'task': {
      const who = node.who !== 'both' && run.swapped ? partnerOf(node.who) : node.who;
      const reader = readerOf(script, run);
      const hidden = viewer !== reader;
      return {
        body: {
          kind: 'task',
          who,
          reader,
          hidden,
          title: hidden ? '' : f(node.title),
          text: hidden ? '' : f(node.text),
          timer: hidden ? undefined : node.timer,
          blind: who === 'both' ? run.blind : run.blind.filter((role) => role === who),
        },
        actor: reader,
      };
    }
    case 'effect': {
      const applied = run.applied ?? { hp: node.hp ?? 0, clothing: node.clothing ?? 0, penalty: null, lostItem: null };
      return {
        body: {
          kind: 'effect',
          text: f(node.text),
          who: node.who,
          hp: applied.hp,
          clothing: applied.clothing,
          penalty: applied.penalty,
          lostItem: applied.lostItem,
        },
        actor: 'any',
      };
    }
    case 'reward':
      return { body: { kind: 'reward', text: f(node.text), item: node.item }, actor: 'any' };
  }
}

/** Сцена для одного з телефонів. Однакова для обох, окрім завдань: їх бачить лише той, хто кидав кубик. */
export function sceneFor(state: AdvState, script: StoryScript, viewer: Role): SceneView {
  const run = state.run!;
  const { body, actor } = bodyFor(state, script, viewer);
  return {
    storyTitle: script.title,
    chapter: run.chapter,
    chapters: script.chapters.length,
    body,
    actor,
    usable: usableItems(state, script),
  };
}
