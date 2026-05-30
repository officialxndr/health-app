import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'

const PhaseSchema = z.object({
  name: z.string().min(1),
  goalType: z.enum(['LOSE', 'GAIN', 'MAINTAIN']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetWeightKg: z.number().positive().optional(),
  targetBodyFat: z.number().min(1).max(60).optional(),
  weeklyRateKg: z.number().optional(),
  calorieTarget: z.number().int().positive().optional(),
  proteinTarget: z.number().int().positive().optional(),
  carbsTarget: z.number().int().positive().optional(),
  fatTarget: z.number().int().positive().optional(),
})

const CycleSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blocks: z.array(
    z.object({
      name: z.string(),
      goalType: z.enum(['LOSE', 'GAIN', 'MAINTAIN']),
      weeks: z.number().int().positive(),
      weeklyRateKg: z.number().optional(),
      calorieTarget: z.number().int().positive().optional(),
      proteinTarget: z.number().int().positive().optional(),
      carbsTarget: z.number().int().positive().optional(),
      fatTarget: z.number().int().positive().optional(),
    })
  ).min(1),
  repeat: z.number().int().min(1).max(52).default(1),
})

async function checkOverlap(
  userId: string,
  startDate: Date,
  endDate: Date,
  excludeId?: string
): Promise<boolean> {
  const overlapping = await prisma.goalPhase.findFirst({
    where: {
      userId,
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ],
    },
  })
  return !!overlapping
}

const goalPhaseRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { onRequest: [fastify.authenticate] }, async (request) => {
    return prisma.goalPhase.findMany({
      where: { userId: request.user.userId },
      orderBy: { startDate: 'asc' },
    })
  })

  fastify.get('/active', { onRequest: [fastify.authenticate] }, async (request) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activePhase = await prisma.goalPhase.findFirst({
      where: {
        userId: request.user.userId,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    })

    if (activePhase) return { source: 'phase', phase: activePhase }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: request.user.userId },
    })
    return { source: 'profile', profile }
  })

  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = PhaseSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input', details: body.error.issues })

    const start = new Date(body.data.startDate)
    const end = new Date(body.data.endDate)
    if (start >= end) return reply.status(400).send({ error: 'startDate must be before endDate' })

    const hasOverlap = await checkOverlap(request.user.userId, start, end)
    if (hasOverlap) return reply.status(409).send({ error: 'Phase overlaps with an existing phase' })

    return prisma.goalPhase.create({
      data: {
        userId: request.user.userId,
        ...body.data,
        startDate: start,
        endDate: end,
      },
    })
  })

  fastify.post('/cycle', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = CycleSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input', details: body.error.issues })

    const cycleId = crypto.randomUUID()
    const phases = []
    let cursor = new Date(body.data.startDate)

    for (let rep = 0; rep < body.data.repeat; rep++) {
      for (const block of body.data.blocks) {
        const start = new Date(cursor)
        const end = new Date(cursor)
        end.setDate(end.getDate() + block.weeks * 7)

        const hasOverlap = await checkOverlap(request.user.userId, start, end)
        if (hasOverlap) {
          return reply.status(409).send({ error: `Phase "${block.name}" (rep ${rep + 1}) overlaps with an existing phase` })
        }

        phases.push({
          userId: request.user.userId,
          name: body.data.repeat > 1 ? `${block.name} ${rep + 1}` : block.name,
          goalType: block.goalType,
          startDate: start,
          endDate: end,
          weeklyRateKg: block.weeklyRateKg,
          calorieTarget: block.calorieTarget,
          proteinTarget: block.proteinTarget,
          carbsTarget: block.carbsTarget,
          fatTarget: block.fatTarget,
          cycleId,
        })

        cursor = new Date(end)
      }
    }

    await prisma.goalPhase.createMany({ data: phases })
    return prisma.goalPhase.findMany({ where: { cycleId }, orderBy: { startDate: 'asc' } })
  })

  fastify.put<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const existing = await prisma.goalPhase.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!existing) return reply.status(404).send({ error: 'Not found' })

      const body = PhaseSchema.partial().safeParse(request.body)
      if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

      const start = body.data.startDate ? new Date(body.data.startDate) : existing.startDate
      const end = body.data.endDate ? new Date(body.data.endDate) : existing.endDate

      if (start >= end) return reply.status(400).send({ error: 'startDate must be before endDate' })

      const hasOverlap = await checkOverlap(request.user.userId, start, end, existing.id)
      if (hasOverlap) return reply.status(409).send({ error: 'Phase overlaps with an existing phase' })

      const update: Record<string, any> = { ...body.data }
      if (update.startDate) update.startDate = start
      if (update.endDate) update.endDate = end

      return prisma.goalPhase.update({ where: { id: existing.id }, data: update })
    }
  )

  fastify.delete<{ Params: { id: string }; Querystring: { cycle?: string } }>(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const existing = await prisma.goalPhase.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!existing) return reply.status(404).send({ error: 'Not found' })

      if (request.query.cycle === 'true' && existing.cycleId) {
        await prisma.goalPhase.deleteMany({
          where: { cycleId: existing.cycleId, userId: request.user.userId },
        })
        return { ok: true, deleted: 'cycle' }
      }

      await prisma.goalPhase.delete({ where: { id: existing.id } })
      return { ok: true }
    }
  )
}

export default goalPhaseRoutes
