import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PromptInputSchema } from '@core/games/truth-or-dare/content.schema';
import { promptsRepository } from './repository';

const IdParamsSchema = z.object({ id: z.coerce.number().int().positive() });
const PromptPatchSchema = PromptInputSchema.partial();

/** CRUD для редактора «Правди або дії». Доступний лише з комп'ютера (див. net/local-only). */
export async function truthOrDareRoutes(app: FastifyInstance) {
  app.get('/prompts', async () => promptsRepository.list());

  app.post('/prompts', async (request, reply) => {
    const body = PromptInputSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Некоректні дані', issues: body.error.issues });
    return reply.code(201).send(promptsRepository.create(body.data));
  });

  app.patch('/prompts/:id', async (request, reply) => {
    const params = IdParamsSchema.safeParse(request.params);
    const body = PromptPatchSchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: 'Некоректні дані' });

    const updated = promptsRepository.update(params.data.id, body.data);
    if (!updated) return reply.code(404).send({ error: 'Запис не знайдено' });
    return updated;
  });

  app.delete('/prompts/:id', async (request, reply) => {
    const params = IdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'Некоректний id' });

    if (!promptsRepository.remove(params.data.id)) return reply.code(404).send({ error: 'Запис не знайдено' });
    return reply.code(204).send();
  });
}
