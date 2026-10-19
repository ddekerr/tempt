import type { Audience, PromptKind } from '@core/games/truth-or-dare/content.schema';

export const KIND_LABEL: Record<PromptKind, string> = {
  truth: 'Правда',
  dare: 'Дія',
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  male: 'Для нього',
  female: 'Для неї',
  both: 'Для обох',
};

/** Колір мітки адресата: латунь для нього, рожевий для неї (див. брендбук). */
export const AUDIENCE_TEXT_CLASS: Record<Audience, string> = {
  male: 'text-brass border-brass',
  female: 'text-rose border-rose',
  both: 'text-bone border-bone/50',
};
