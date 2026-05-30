import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const WeightEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive(),
  bodyFat: z.number().min(1).max(60).optional(),
  source: z.enum(['MANUAL', 'APPLE_HEALTH', 'SHORTCUT']).default('MANUAL'),
})

const ShortcutSchema = z.object({
  token: z.string(),
  weight_kg: z.number().optional(),
  steps: z.number().int().optional(),
  active_calories: z.number().optional(),
  resting_calories: z.number().optional(),
  sleep_hours: z.number().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

function rollingAvg(entries: { weightKg: number }[], window: number): number | null {
  const slice = entries.slice(-window)
  if (slice.length === 0) return null
  return slice.reduce((sum, e) => sum + e.weightKg, 0) / slice.length
}

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { from?: string; to?: string } }>(
    '/weight',
    { onRequest: [fastify.authenticate] },
    async (request) => {
      const { from, to } = request.query
      return prisma.weightEntry.findMany({
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

  fastify.post('/weight', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = WeightEntrySchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input', details: body.error.issues })

    return prisma.weightEntry.upsert({
      where: { userId_date: { userId: request.user.userId, date: new Date(body.data.date) } },
      update: { weightKg: body.data.weightKg, bodyFat: body.data.bodyFat, source: body.data.source },
      create: {
        userId: request.user.userId,
        date: new Date(body.data.date),
        weightKg: body.data.weightKg,
        bodyFat: body.data.bodyFat,
        source: body.data.source,
      },
    })
  })

  fastify.delete<{ Params: { id: string } }>(
    '/weight/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const entry = await prisma.weightEntry.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!entry) return reply.status(404).send({ error: 'Not found' })
      await prisma.weightEntry.delete({ where: { id: entry.id } })
      return { ok: true }
    }
  )

  fastify.get('/stats', { onRequest: [fastify.authenticate] }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { profile: true },
    })
    const profile = user?.profile

    const now = new Date()
    const days90Ago = new Date(now); days90Ago.setDate(now.getDate() - 90)

    const allEntries = await prisma.weightEntry.findMany({
      where: { userId: request.user.userId, date: { gte: days90Ago } },
      orderBy: { date: 'asc' },
    })

    const current = allEntries.at(-1)
    const avg7 = rollingAvg(allEntries, 7)
    const avg14 = rollingAvg(allEntries, 14)
    const prevAvg7 = rollingAvg(allEntries.slice(0, -7), 7)

    const weeklyChange = avg7 !== null && prevAvg7 !== null ? avg7 - prevAvg7 : null
    const goalWeight = profile?.goalWeightKg
    const goalDate = profile?.goalDate
    let goalEta: string | null = null
    if (goalWeight && weeklyChange && weeklyChange !== 0 && avg7) {
      const weeksLeft = (avg7 - goalWeight) / weeklyChange
      const eta = new Date(now)
      eta.setDate(now.getDate() + Math.round(weeksLeft * 7))
      goalEta = eta.toISOString().split('T')[0]
    }

    // Pace adjustment
    let requiredWeeklyRate: number | null = null
    let dailyCalorieDelta: number | null = null
    let onTrack = false
    if (goalWeight && goalDate && avg7) {
      const weeksUntilGoal = (new Date(goalDate).getTime() - now.getTime()) / (7 * 86400 * 1000)
      if (weeksUntilGoal > 0) {
        requiredWeeklyRate = (avg7 - goalWeight) / weeksUntilGoal
        const rateGap = requiredWeeklyRate - (weeklyChange ?? 0)
        dailyCalorieDelta = (rateGap * 7700) / 7
        onTrack = Math.abs(rateGap) < 0.1
      }
    }

    // 7-day calorie avg
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7)
    const recentLogs = await prisma.foodLog.findMany({
      where: { userId: request.user.userId, date: { gte: sevenDaysAgo } },
      include: { foodItem: true },
    })
    const calorieAvg7 = recentLogs.length > 0
      ? recentLogs.reduce((sum, l) => sum + (l.foodItem?.calories ?? 0) * l.servingQty, 0) / 7
      : null

    return {
      current: current ?? null,
      avg7,
      avg14,
      weeklyChange,
      goalEta,
      requiredWeeklyRate,
      dailyCalorieDelta,
      onTrack,
      calorieAvg7: calorieAvg7 ? Math.round(calorieAvg7) : null,
      entries: allEntries,
    }
  })

  // iOS Shortcut webhook
  fastify.post('/apple/shortcut', async (request, reply) => {
    const body = ShortcutSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    // Find user by api token stored in token field (simple bearer-style check)
    // For now using the token as userId directly — replace with proper API tokens in Phase 6
    const user = await prisma.user.findUnique({ where: { id: body.data.token } })
    if (!user) return reply.status(401).send({ error: 'Invalid token' })

    const date = new Date(body.data.date)

    if (body.data.weight_kg) {
      await prisma.weightEntry.upsert({
        where: { userId_date: { userId: user.id, date } },
        update: { weightKg: body.data.weight_kg, source: 'SHORTCUT' },
        create: { userId: user.id, date, weightKg: body.data.weight_kg, source: 'SHORTCUT' },
      })
    }

    await prisma.healthImport.create({
      data: {
        userId: user.id,
        type: 'SHORTCUT',
        recordCount: body.data.weight_kg ? 1 : 0,
      },
    })

    return { ok: true }
  })
}

export default healthRoutes
