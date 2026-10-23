import { StoryScriptSchema } from './script.schema';
import type { Chapter, StoryNode, StoryScript } from './script.types';

const where = (chapter: number, index: number, node: StoryNode) =>
  `Глава ${chapter}, вузол ${index + 1} (${node.kind}${node.id ? ` «${node.id}»` : ''})`;

/** Куди може піти історія після вузла: явні посилання й, якщо вони не все закривають, наступний у масиві. */
function exits(node: StoryNode): { targets: string[]; falls: boolean } {
  const targets: string[] = [];
  let falls = node.next === undefined;
  if (node.next) targets.push(node.next);

  if (node.kind === 'choice') {
    targets.push(...node.options.map((option) => option.next));
    falls = false;
  }
  if (node.kind === 'dice') {
    targets.push(...node.outcomes.map((outcome) => outcome.next));
    falls = false;
  }
  if (node.kind === 'check') {
    if (node.onSuccess) targets.push(node.onSuccess);
    if (node.onFail) targets.push(node.onFail);
    // Якщо хоч одна гілка не вказана, вона веде до наступного вузла.
    falls = node.next === undefined && (!node.onSuccess || !node.onFail);
  }
  return { targets, falls };
}

function validateChapter(chapter: Chapter, number: number): string[] {
  const problems: string[] = [];
  const { nodes } = chapter;
  const indexById = new Map<string, number>();

  nodes.forEach((node, index) => {
    if (!node.id) return;
    if (indexById.has(node.id)) problems.push(`${where(number, index, node)}: id «${node.id}» уже є в цій главі.`);
    indexById.set(node.id, index);
  });

  if (nodes[0].kind !== 'title') problems.push(`Глава ${number}: перший вузол має бути заголовком (title).`);

  const edges: number[][] = nodes.map((node, index) => {
    const { targets, falls } = exits(node);
    const out: number[] = [];
    for (const target of targets) {
      if (target === 'end') continue;
      const found = indexById.get(target);
      if (found === undefined) problems.push(`${where(number, index, node)}: немає вузла з id «${target}».`);
      else out.push(found);
    }
    if (falls && index + 1 < nodes.length) out.push(index + 1);
    return out;
  });

  nodes.forEach((node, index) => {
    if (node.kind === 'dice') {
      for (const outcome of node.outcomes) {
        if (outcome.min > outcome.max) {
          problems.push(`${where(number, index, node)}: діапазон ${outcome.min}–${outcome.max} навпаки.`);
        }
      }
      for (let value = 1; value <= 6; value++) {
        if (!node.outcomes.some((o) => value >= o.min && value <= o.max)) {
          problems.push(`${where(number, index, node)}: для числа ${value} немає розв'язки.`);
        }
      }
    }
  });

  const seen = new Set<number>();
  const stack = [0];
  while (stack.length) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...edges[current]);
  }
  nodes.forEach((node, index) => {
    if (!seen.has(index)) problems.push(`${where(number, index, node)}: до цього вузла неможливо дійти.`);
  });

  // Цикл зробив би главу нескінченною.
  const state = new Map<number, 'open' | 'done'>();
  const visit = (index: number): boolean => {
    if (state.get(index) === 'open') return true;
    if (state.get(index) === 'done') return false;
    state.set(index, 'open');
    const looped = edges[index].some(visit);
    state.set(index, 'done');
    return looped;
  };
  if (visit(0)) problems.push(`Глава ${number}: сцени ходять по колу, глава ніколи не закінчиться.`);

  return problems;
}

/** Змістові перевірки, які схема сама не робить: посилання, досяжність, цикли, покриття кубика. */
export function validateScript(script: StoryScript): string[] {
  return script.chapters.flatMap((chapter, index) => validateChapter(chapter, index + 1));
}

/** Читабельні помилки схеми: «Глава 2, вузол 5, поле timer: …». */
function schemaProblems(id: string, data: unknown): string[] {
  const result = StoryScriptSchema.safeParse(data);
  if (result.success) return [];

  return result.error.issues.map((issue) => {
    const path = [...issue.path];
    const parts: string[] = [];
    if (path[0] === 'chapters' && typeof path[1] === 'number') {
      parts.push(`Глава ${path[1] + 1}`);
      path.splice(0, 2);
      if (path[0] === 'nodes' && typeof path[1] === 'number') {
        parts.push(`вузол ${path[1] + 1}`);
        path.splice(0, 2);
      }
    }
    if (path.length) parts.push(`поле ${path.join('.')}`);
    return `${parts.join(', ') || 'Історія'}: ${issue.message}`;
  });
}

/**
 * Перетворює сирі дані з JSON на перевірений сценарій. При будь-якій помилці кидає одну помилку
 * з повним списком, щоб виправити все за раз.
 */
export function parseScript(file: string, data: unknown): StoryScript {
  const problems = schemaProblems(file, data);
  if (problems.length === 0) {
    const script = StoryScriptSchema.parse(data);
    problems.push(...validateScript(script));
    if (problems.length === 0) return script;
  }
  throw new Error(`Історія «${file}» має помилки:\n${problems.map((line) => `  • ${line}`).join('\n')}`);
}
