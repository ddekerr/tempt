import type { Role } from '@core/roles';

export const ROLE_LABEL: Record<Role, string> = {
  male: 'Для нього',
  female: 'Для неї',
};

/** Латунь для нього, рожевий для неї (див. брендбук). */
export const ROLE_TEXT_CLASS: Record<Role, string> = {
  male: 'text-brass',
  female: 'text-rose',
};

export const ROLE_BORDER_CLASS: Record<Role, string> = {
  male: 'border-brass',
  female: 'border-rose',
};
