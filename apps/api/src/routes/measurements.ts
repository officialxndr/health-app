import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const MeasurementSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  neck: z.number().positive().optional(),
  shoulders: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  leftArm: z.number().positive().optional(),
  rightArm: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  leftThigh: z.number().positive().optional(),
  rightThigh: z.number().positive().optional(),
  leftCalf: z.number().positive().optional(),
  rightCalf: z.number().positive().optional(),
  notes: z.string().optional(),
})

const measurementRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { from?: string; to?: string } }>(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request) => {
      const { from, to } = request.query
      return prisma.bodyMeasurement.findMany({
        where: {
          userId: request.user.userId,
          ...(from || to
            ? {
                date: {
                  ...(from ? { gte: new Date(from) } : {}),
                  ...(to ? { lte: new Date(to) } : {}),
                },
              }
            : {}),
        },
        orderBy: { date: 'asc' },
      })
    }
  )

  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = MeasurementSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input', details: body.error.issues })

    const { date, ...fields } = body.data
    return prisma.bodyMeasurement.create({
      data: { userId: request.user.userId, date: new Date(date), ...fields },
    })
  })

  fastify.put<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const existing = await prisma.bodyMeasurement.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!existing) return reply.status(404).send({ error: 'Not found' })

      const body = MeasurementSchema.partial().safeParse(request.body)
      if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

      const update: Record<string, any> = { ...body.data }
      if (update.date) update.date = new Date(update.date)

      return prisma.bodyMeasurement.update({ where: { id: existing.id }, data: update })
    }
  )

  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const existing = await prisma.bodyMeasurement.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!existing) return reply.status(404).send({ error: 'Not found' })
      await prisma.bodyMeasurement.delete({ where: { id: existing.id } })
      return { ok: true }
    }
  )
}

export default measurementRoutes
