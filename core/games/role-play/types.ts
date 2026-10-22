import { z } from 'zod';
import type { Ctx } from '../../game';
import type { Role } from '../../roles';
import { INTENSITIES, type Intensity, type RoleCard, type Scenario, type ScenarioSummary } from './content.schema';

/** Дії можуть робити обоє: черги тут немає, хто перший обрав, той і обрав. */
export const RpActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('pick'), scenarioId: z.number().int().positive() }),
  /** «Мені пощастить»: випадковий сценарій, за бажанням лише з цим рівнем. */
  z.object({ type: z.literal('random'), intensity: z.enum(INTENSITIES).nullable() }),
  /** Повернутись до списку й обрати інший сценарій. */
  z.object({ type: z.literal('back') }),
]);

export type RpAction = z.infer<typeof RpActionSchema>;

export interface RpState {
  names: Record<Role, string>;
  phase: 'choosing' | 'playing';
  /** Знімок списку сценаріїв на момент, коли гравці його бачать. Оновлюється при поверненні до списку. */
  catalog: ScenarioSummary[];
  /** Обраний сценарій з обома ролями. Кожному гравцеві віддається лише його роль, див. viewFor. */
  scenario: Scenario | null;
  /** Сценарії, що вже випадали в цій грі, щоб «Мені пощастить» не повторювалось, доки є нові. */
  seen: number[];
}

export type RpView =
  | { mode: 'choosing'; catalog: ScenarioSummary[] }
  | {
      mode: 'playing';
      scenarioId: number;
      title: string;
      intensity: Intensity;
      /** Назва ролі партнера не секрет, а от її картка секретна й сюди не потрапляє. */
      partnerRoleName: string;
      role: RoleCard;
    };

/** Дані гри від сервера: активні сценарії з бази. */
export interface RpCtx extends Ctx {
  catalog: () => ScenarioSummary[];
  scenario: (id: number) => Scenario | undefined;
}
