import { z } from 'zod';

export const INTENSITIES = ['gentle', 'medium', 'intense', 'bdsm'] as const;

export type Intensity = (typeof INTENSITIES)[number];

export const TITLE_MAX = 80;
export const ROLE_NAME_MAX = 60;
export const TEXT_MAX = 2000;
export const OUTFIT_MAX = 500;
export const PHRASE_MAX = 300;
export const PHRASES_MAX = 20;

/** Картка однієї ролі: те, що читає лише той, кому вона дісталась. */
export const RoleCardSchema = z.object({
  roleName: z.string().trim().min(1, 'Вкажи назву ролі').max(ROLE_NAME_MAX),
  description: z.string().trim().min(1, 'Додай опис').max(TEXT_MAX),
  howToStart: z.string().trim().max(TEXT_MAX),
  phrases: z.array(z.string().trim().min(1).max(PHRASE_MAX)).max(PHRASES_MAX),
  outfit: z.string().trim().max(OUTFIT_MAX),
  guide: z.string().trim().max(TEXT_MAX),
});

/** Сценарій: спільна назва й рівень, а ролі для нього й для неї описані окремо. */
export const ScenarioInputSchema = z.object({
  title: z.string().trim().min(1, 'Вкажи назву').max(TITLE_MAX),
  intensity: z.enum(INTENSITIES),
  active: z.boolean(),
  male: RoleCardSchema,
  female: RoleCardSchema,
});

export const ScenarioSchema = ScenarioInputSchema.extend({ id: z.number().int().positive() });

export type RoleCard = z.infer<typeof RoleCardSchema>;
export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;

/** Те, що показує список сценаріїв: без самих ролей. */
export type ScenarioSummary = Pick<Scenario, 'id' | 'title' | 'intensity'>;
