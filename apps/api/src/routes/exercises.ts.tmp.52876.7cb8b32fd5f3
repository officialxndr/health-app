import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const ExerciseCreateSchema = z.object({
  name: z.string().min(1),
  nameAlternative: z.string().optional(),
  description: z.string().optional(),
  muscleGroup: z.string().optional(),
  musclesPrimary: z.array(z.string()).default([]),
  musclesSecondary: z.array(z.string()).default([]),
  equipment: z.string().optional(),
  category: z.string().optional(),
})

const exerciseRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { q?: string; muscle?: string; equipment?: string } }>(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request) => {
      const { q, muscle, equipment } = request.query
      return prisma.exercise.findMany({
        where: {
          ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
          ...(muscle ? { muscleGroup: { contains: muscle, mode: 'insensitive' } } : {}),
          ...(equipment ? { equipment: { contains: equipment, mode: 'insensitive' } } : {}),
        },
        orderBy: [{ isCustom: 'desc' }, { name: 'asc' }],
        take: 50,
      })
    }
  )

  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const exercise = await prisma.exercise.findUnique({ where: { id: request.params.id } })
      if (!exercise) return reply.status(404).send({ error: 'Not found' })
      return exercise
    }
  )

  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = ExerciseCreateSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input', details: body.error.issues })
    return prisma.exercise.create({ data: { ...body.data, isCustom: true } })
  })
}

export default exerciseRoutes
