import type { Role } from '../../roles';

/**
 * Сценарій історії. Глава це масив вузлів. За замовчуванням після вузла йде наступний у масиві,
 * а розгалуження посилаються на `id` вузлів. `next: 'end'` завершує главу.
 * У текстах {male} і {female} підставляються іменами гравців.
 */

export type Target = string | 'end';

interface Base {
  id?: string;
  next?: Target;
}

/** Заголовок, яким починається глава. */
export interface TitleNode extends Base {
  kind: 'title';
  title: string;
  text: string;
}

/** Оповідь або репліка. */
export interface SayNode extends Base {
  kind: 'say';
  speaker?: string;
  text: string;
}

/** Вибір, який робить один із героїв. */
export interface ChoiceNode extends Base {
  kind: 'choice';
  chooser: Role;
  text: string;
  options: { label: string; next: string }[];
}

/** Кидок d20: успіх, якщо випало не менше за складність. */
export interface CheckNode extends Base {
  kind: 'check';
  roller: Role;
  text: string;
  /** Підпис дії, наприклад «Прошмигнути повз». */
  label: string;
  difficulty: number;
  onSuccess?: Target;
  onFail?: Target;
}

/** Кидок d6, що вирішує, як піде сцена. Діапазони мають покривати 1..6. */
export interface DiceNode extends Base {
  kind: 'dice';
  roller: Role;
  text: string;
  outcomes: { min: number; max: number; text: string; next: string }[];
}

export type TaskWho = Role | 'both';

/** Завдання для пари. Без `timer` просто «Готово». */
export interface TaskNode extends Base {
  kind: 'task';
  who: TaskWho;
  title: string;
  text: string;
  /** Секунди. */
  timer?: number;
}

/** Зміна показників героя. Застосовується одразу, як сцена з'являється. */
export interface EffectNode extends Base {
  kind: 'effect';
  who: Role;
  text: string;
  hp?: number;
  clothing?: number;
}

export const ITEM_EFFECTS = ['reroll', 'swap'] as const;
export type ItemEffect = (typeof ITEM_EFFECTS)[number];

export interface RewardItem {
  name: string;
  icon: string;
  description: string;
  /** Що предмет вміє. Без цього він просто прикраса скарбниці. */
  effect?: ItemEffect;
}

export interface RewardNode extends Base {
  kind: 'reward';
  text: string;
  item: RewardItem;
}

export type StoryNode = TitleNode | SayNode | ChoiceNode | CheckNode | DiceNode | TaskNode | EffectNode | RewardNode;

export interface Chapter {
  title: string;
  nodes: StoryNode[];
}

export interface GuideCard {
  title: string;
  text: string;
}

export interface Episode {
  title: string;
  text: string;
  timer?: number;
}

export interface StoryScript {
  id: string;
  title: string;
  description: string;
  /** Показується один раз перед першою главою. */
  guide: GuideCard[];
  chapters: Chapter[];
  /** Що ви робите, коли герой падає без сил: випадає, якщо кидок на повернення невдалий. */
  resurrection: Episode[];
  /** Останній ритуал: його вирішує d6, тож варіантів рівно шість. */
  ritual: Episode[];
  /** Фінальний текст після бажання. */
  epilogue: string;
}
