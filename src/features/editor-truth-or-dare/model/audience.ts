import type { Audience } from '@core/games/truth-or-dare/content.schema';

/** Вибір в інтерфейсі: хлопець, дівчина або нічого. Нічого означає «для обох». */
export type AudienceChoice = 'male' | 'female' | null;

export const toAudience = (choice: AudienceChoice): Audience => choice ?? 'both';

export const toChoice = (audience: Audience): AudienceChoice => (audience === 'both' ? null : audience);
