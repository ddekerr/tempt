import { describe, expect, it } from 'vitest';
import type { StoryScript } from './script.types';
import { parseScript, validateScript } from './script.validate';
import { SCRIPTS } from './stories';

const clone = (script: StoryScript): StoryScript => structuredClone(script);
const base = SCRIPTS[0];

describe.each(SCRIPTS.map((script) => [script.id, script] as [string, StoryScript]))('сценарій %s', (_id, script) => {
  it('проходить усі перевірки: посилання, досяжність, цикли, кубики', () => {
    expect(validateScript(script)).toEqual([]);
  });

  it('має глави, гід, 6 ритуалів і воскресіння', () => {
    expect(script.chapters.length).toBeGreaterThan(0);
    expect(script.guide.length).toBeGreaterThan(0);
    expect(script.ritual).toHaveLength(6);
    expect(script.resurrection.length).toBeGreaterThan(0);
  });
});

describe('помилки в даних історії', () => {
  const message = (mutate: (script: StoryScript) => void) => {
    const script = clone(base);
    mutate(script);
    try {
      parseScript('test.json', script);
    } catch (error) {
      return (error as Error).message;
    }
    return '';
  };

  it('справжня історія завантажується без помилок', () => {
    expect(() => parseScript('masquerade.json', structuredClone(base))).not.toThrow();
  });

  it('вказує главу, вузол і поле при опечатці', () => {
    const text = message((s) => {
      const task = s.chapters[1].nodes.find((n) => n.kind === 'task')!;
      (task as unknown as Record<string, unknown>).timr = 30;
    });
    expect(text).toContain('Глава 2');
    expect(text).toContain('вузол');
  });

  it('ловить посилання на неіснуючий вузол', () => {
    const text = message((s) => {
      const check = s.chapters[0].nodes.find((n) => n.kind === 'check')!;
      if (check.kind === 'check') check.onFail = 'нема-такого';
    });
    expect(text).toContain('немає вузла з id «нема-такого»');
  });

  it('ловить недосяжний вузол', () => {
    const text = message((s) => {
      s.chapters[0].nodes.splice(1, 0, { kind: 'say', text: 'мертвий', next: 'end' }, { kind: 'say', text: 'теж' });
      s.chapters[0].nodes[0].next = 'end';
    });
    expect(text).toContain('неможливо дійти');
  });

  it('ловить цикл', () => {
    const text = message((s) => {
      const nodes = s.chapters[0].nodes;
      nodes[1].id = 'a';
      nodes[2].next = 'a';
    });
    expect(text).toContain('по колу');
  });

  it('ловить діру в кубику d6', () => {
    const text = message((s) => {
      const dice = s.chapters[1].nodes.find((n) => n.kind === 'dice')!;
      if (dice.kind === 'dice') dice.outcomes[0].min = 2;
    });
    expect(text).toContain('для числа 1 немає розв');
  });

  it('вимагає рівно 6 варіантів ритуалу', () => {
    expect(message((s) => s.ritual.pop())).toContain('ritual');
  });

  it('збирає всі помилки разом', () => {
    const text = message((s) => {
      s.ritual.pop();
      s.epilogue = '';
    });
    expect(text.split('•').length).toBeGreaterThan(2);
  });
});
