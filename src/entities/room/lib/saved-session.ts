import type { Role } from '@core/roles';

/** Токен пристрою й останнє ім'я. Сховище може бути недоступним, тоді просто нічого не пам'ятаємо. */
export interface SavedSession {
  token?: string;
  name?: string;
}

const key = (role: Role) => `tempt:session:${role}`;

export function loadSession(role: Role): SavedSession {
  try {
    return JSON.parse(localStorage.getItem(key(role)) ?? '{}') as SavedSession;
  } catch {
    return {};
  }
}

export function saveSession(role: Role, session: SavedSession) {
  try {
    localStorage.setItem(key(role), JSON.stringify(session));
  } catch {
    // сховище недоступне, граємо без запам'ятовування
  }
}
