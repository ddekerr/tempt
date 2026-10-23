import { describe, expect, it } from 'vitest';
import type { Chapter, StoryNode, StoryScript } from './script.types';
import { SCRIPTS } from './stories';

const targetsOf = (node: StoryNode): string[] => {
  const targets: (string | undefined)[] = [node.next];
  if (node.kind === 'choice') targets.push(...node.options.map((o) => o.next));
  if (node.kind === 'check') targets.push(node.onSuccess, node.onFail);
  if (node.kind === 'dice') targets.push(...node.outcomes.map((o) => o.next));
  return targets.filter((t): t is string => t !== undefined && t !== 'end');
};

function reachable(chapter: Chapter): Set<number> {
  const seen = new Set<number>();
  const visit = (index: number) => {
    if (index < 0 || index >= chapter.nodes.length || seen.has(index)) return;
    seen.add(index);
    const node = chapter.nodes[index];
    const explicit = targetsOf(node).map((id) => chapter.nodes.findIndex((n) => n.id === id));
    explicit.forEach(visit);
    const needsDefault =
      node.kind === 'choice'
        ? false
        : node.next === undefined && (node.kind !== 'check' || !node.onSuccess || !node.onFail);
    if (needsDefault) visit(index + 1);
  };
  visit(0);
  return seen;
}

describe.each(SCRIPTS.map((script) => [script.id, script] as [string, StoryScript]))('сценарій %s', (_id, script) => {
  it('має глави, гід, 6 ритуалів і воскресінь', () => {
    expect(script.chapters.length).toBeGreaterThan(0);
    expect(script.guide.length).toBeGreaterThan(0);
    expect(script.ritual).toHaveLength(6);
    expect(script.resurrection.length).toBeGreaterThan(0);
  });

  it.each(script.chapters.map((chapter, i) => [i + 1, chapter] as [number, Chapter]))(
    'глава %i: усі посилання існують, id унікальні',
    (_n, chapter) => {
      const ids = chapter.nodes.map((n) => n.id).filter((id): id is string => !!id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const node of chapter.nodes) {
        for (const target of targetsOf(node)) expect(ids, `«${target}»`).toContain(target);
      }
      expect(chapter.nodes[0].kind).toBe('title');
    },
  );

  it.each(script.chapters.map((chapter, i) => [i + 1, chapter] as [number, Chapter]))(
    'глава %i: кожен вузол досяжний',
    (_n, chapter) => {
      const seen = reachable(chapter);
      chapter.nodes.forEach((node, index) => expect(seen.has(index), `вузол ${index} (${node.kind})`).toBe(true));
    },
  );

  it('кубики d6 покривають 1..6, складності в межах d20', () => {
    for (const chapter of script.chapters) {
      for (const node of chapter.nodes) {
        if (node.kind === 'dice') {
          for (let value = 1; value <= 6; value++) {
            expect(node.outcomes.some((o) => value >= o.min && value <= o.max)).toBe(true);
          }
        }
        if (node.kind === 'check') {
          expect(node.difficulty).toBeGreaterThanOrEqual(2);
          expect(node.difficulty).toBeLessThanOrEqual(20);
        }
      }
    }
  });

  it('усі тексти непорожні', () => {
    const json = JSON.stringify(script);
    expect(json).not.toMatch(/"(text|title|label)":""/);
  });
});
