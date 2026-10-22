import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ScenarioInputSchema } from '@core/games/role-play/content.schema';
import { scenariosRepository } from './repository';

const IdParamsSchema = z.object({ id: z.coerce.number().int().positive() });
const ScenarioPatchSchema = ScenarioInputSchema.partial();

/** CRUD для редактора «Рольових ігор». Доступний лише з комп'ютера (див. net/local-only). */
export async function rolePlayRoutes(app: FastifyInstance) {
  app.get('/scenarios', async () => scenariosRepository.list());

  app.post('/scenarios', async (request, reply) => {
    const body = ScenarioInputSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Некоректні дані', issues: body.error.issues });
    return reply.code(201).send(scenariosRepository.create(body.data));
  });

  app.patch('/scenarios/:id', async (request, reply) => {
    const params = IdParamsSchema.safeParse(request.params);
    const body = ScenarioPatchSchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: 'Некоректні дані' });

    const updated = scenariosRepository.update(params.data.id, body.data);
    if (!updated) return reply.code(404).send({ error: 'Сценарій не знайдено' });
    return updated;
  });

  app.delete('/scenarios/:id', async (request, reply) => {
    const params = IdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'Некоректний id' });

    if (!scenariosRepository.remove(params.data.id)) return reply.code(404).send({ error: 'Сценарій не знайдено' });
    return reply.code(204).send();
  });
}
