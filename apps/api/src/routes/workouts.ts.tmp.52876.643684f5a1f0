import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const TemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      defaultSets: z.number().int().positive().default(3),
      defaultReps: z.number().int().positive().optional(),
      defaultWeightKg: z.number().min(0).optional(),
      restSeconds: z.number().int().positive().optional(),
      order: z.number().int().min(0),
    })
  ).default([]),
})

const SessionStartSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().optional(),
  startedAt: z.string().datetime({ offset: true }).optional(),
})

const SessionUpdateSchema = z.object({
  name: z.string().optional(),
  notes: z.string().optional(),
  finishedAt: z.string().datetime({ offset: true }).optional(),
  exercises: z.array(
    z.object({
      id: z.string().optional(),
      exerciseId: z.string(),
      notes: z.string().optional(),
      order: z.number().int().min(0),
      sets: z.array(
        z.object({
          id: z.string().optional(),
          setNumber: z.number().int().positive(),
          weightKg: z.number().min(0),
          reps: z.number().int().min(0),
          rpe: z.number().min(1).max(10).optional(),
        })
      ),
    })
  ).optional(),
})

function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

const workoutRoutes: FastifyPluginAsync = async (fastify) => {
  // ── Templates ──

  fastify.get('/templates', { onRequest: [fastify.authenticate] }, async (request) => {
    return prisma.workoutTemplate.findMany({
      where: { userId: request.user.userId },
      include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    })
  })

  fastify.post('/templates', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = TemplateSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input', details: body.error.issues })

    return prisma.workoutTemplate.create({
      data: {
        userId: request.user.userId,
        name: body.data.name,
        description: body.data.description,
        exercises: { create: body.data.exercises },
      },
      include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
    })
  })

  fastify.put<{ Params: { id: string } }>(
    '/templates/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const existing = await prisma.workoutTemplate.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!existing) return reply.status(404).send({ error: 'Not found' })

      const body = TemplateSchema.partial().safeParse(request.body)
      if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

      if (body.data.exercises) {
        await prisma.templateExercise.deleteMany({ where: { templateId: existing.id } })
      }

      return prisma.workoutTemplate.update({
        where: { id: existing.id },
        data: {
          name: body.data.name,
          description: body.data.description,
          ...(body.data.exercises ? { exercises: { create: body.data.exercises } } : {}),
        },
        include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
      })
    }
  )

  fastify.delete<{ Params: { id: string } }>(
    '/templates/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const existing = await prisma.workoutTemplate.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!existing) return reply.status(404).send({ error: 'Not found' })
      await prisma.workoutTemplate.delete({ where: { id: existing.id } })
      return { ok: true }
    }
  )

  // ── Sessions ──

  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/sessions',
    { onRequest: [fastify.authenticate] },
    async (request) => {
      const page = parseInt(request.query.page ?? '1', 10)
      const limit = Math.min(parseInt(request.query.limit ?? '20', 10), 50)
      const skip = (page - 1) * limit

      const [sessions, total] = await Promise.all([
        prisma.workoutSession.findMany({
          where: { userId: request.user.userId },
          include: {
            exercises: {
              include: { exercise: true, sets: true },
              orderBy: { order: 'asc' },
            },
            template: { select: { name: true } },
          },
          orderBy: { startedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.workoutSession.count({ where: { userId: request.user.userId } }),
      ])

      return { sessions, total, page, limit }
    }
  )

  fastify.get<{ Params: { id: string } }>(
    '/sessions/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const session = await prisma.workoutSession.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
        include: {
          exercises: {
            include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } },
            orderBy: { order: 'asc' },
          },
          template: { select: { name: true } },
        },
      })
      if (!session) return reply.status(404).send({ error: 'Not found' })
      return session
    }
  )

  fastify.post('/sessions', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = SessionStartSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input', details: body.error.issues })

    let exercises: { exerciseId: string; order: number }[] = []
    if (body.data.templateId) {
      const tmpl = await prisma.workoutTemplate.findFirst({
        where: { id: body.data.templateId, userId: request.user.userId },
        include: { exercises: { orderBy: { order: 'asc' } } },
      })
      exercises = tmpl?.exercises.map((e) => ({ exerciseId: e.exerciseId, order: e.order })) ?? []
    }

    return prisma.workoutSession.create({
      data: {
        userId: request.user.userId,
        templateId: body.data.templateId,
        name: body.data.name,
        startedAt: body.data.startedAt ? new Date(body.data.startedAt) : new Date(),
        exercises: { create: exercises },
      },
      include: { exercises: { include: { exercise: true, sets: true }, orderBy: { order: 'asc' } } },
    })
  })

  fastify.put<{ Params: { id: string } }>(
    '/sessions/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const session = await prisma.workoutSession.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!session) return reply.status(404).send({ error: 'Not found' })

      const body = SessionUpdateSchema.safeParse(request.body)
      if (!body.success) return reply.status(400).send({ error: 'Invalid input', details: body.error.issues })

      if (body.data.exercises) {
        // Rebuild exercises and sets
        await prisma.sessionExercise.deleteMany({ where: { sessionId: session.id } })
        for (const ex of body.data.exercises) {
          const created = await prisma.sessionExercise.create({
            data: { sessionId: session.id, exerciseId: ex.exerciseId, notes: ex.notes, order: ex.order },
          })
          if (ex.sets?.length) {
            await prisma.exerciseSet.createMany({
              data: ex.sets.map((s) => ({
                sessionExerciseId: created.id,
                setNumber: s.setNumber,
                weightKg: s.weightKg,
                reps: s.reps,
                rpe: s.rpe,
              })),
            })
          }
        }
      }

      // Compute total volume & detect PRs when finishing
      let totalVolume: number | undefined
      if (body.data.finishedAt) {
        const allSets = await prisma.exerciseSet.findMany({
          where: { sessionExercise: { sessionId: session.id } },
          include: { sessionExercise: true },
        })
        totalVolume = allSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)

        // PR detection per exercise
        const byExercise = new Map<string, typeof allSets>()
        for (const s of allSets) {
          const arr = byExercise.get(s.sessionExercise.exerciseId) ?? []
          arr.push(s)
          byExercise.set(s.sessionExercise.exerciseId, arr)
        }

        for (const [exerciseId, sets] of byExercise) {
          const max1RM = Math.max(...sets.map((s) => epley1RM(s.weightKg, s.reps)))
          const historical = await prisma.exerciseSet.findMany({
            where: {
              sessionExercise: {
                exerciseId,
                session: { userId: request.user.userId, finishedAt: { not: null } },
              },
            },
          })
          const prevMax = historical.length
            ? Math.max(...historical.map((s) => epley1RM(s.weightKg, s.reps)))
            : 0

          if (max1RM > prevMax) {
            const best = sets.reduce((a, b) =>
              epley1RM(a.weightKg, a.reps) >= epley1RM(b.weightKg, b.reps) ? a : b
            )
            await prisma.exerciseSet.update({
              where: { id: best.id },
              data: { isPersonalBest: true },
            })
          }
        }
      }

      const updated = await prisma.workoutSession.update({
        where: { id: session.id },
        data: {
          name: body.data.name,
          notes: body.data.notes,
          finishedAt: body.data.finishedAt ? new Date(body.data.finishedAt) : undefined,
          totalVolume,
        },
        include: {
          exercises: {
            include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } },
            orderBy: { order: 'asc' },
          },
        },
      })
      return updated
    }
  )

  // Last weights for an exercise
  fastify.get<{ Params: { exerciseId: string } }>(
    '/last/:exerciseId',
    { onRequest: [fastify.authenticate] },
    async (request) => {
      const lastSession = await prisma.workoutSession.findFirst({
        where: {
          userId: request.user.userId,
          finishedAt: { not: null },
          exercises: { some: { exerciseId: request.params.exerciseId } },
        },
        orderBy: { startedAt: 'desc' },
        include: {
          exercises: {
            where: { exerciseId: request.params.exerciseId },
            include: { sets: { orderBy: { setNumber: 'asc' } } },
          },
        },
      })
      return lastSession?.exercises[0]?.sets ?? []
    }
  )

  // Personal bests
  fastify.get('/personal-bests', { onRequest: [fastify.authenticate] }, async (request) => {
    return prisma.exerciseSet.findMany({
      where: {
        isPersonalBest: true,
        sessionExercise: { session: { userId: request.user.userId } },
      },
      include: { sessionExercise: { include: { exercise: true } } },
    })
  })

  // Volume over time
  fastify.get<{ Querystring: { from: string; to: string; templateId?: string } }>(
    '/volume',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { from, to, templateId } = request.query
      if (!from || !to) return reply.status(400).send({ error: 'from and to params required' })

      return prisma.workoutSession.findMany({
        where: {
          userId: request.user.userId,
          finishedAt: { not: null },
          startedAt: { gte: new Date(from), lte: new Date(to) },
          ...(templateId ? { templateId } : {}),
        },
        select: { startedAt: true, totalVolume: true, name: true },
        orderBy: { startedAt: 'asc' },
      })
    }
  )
}

export default workoutRoutes
