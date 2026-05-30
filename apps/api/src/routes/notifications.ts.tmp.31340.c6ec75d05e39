import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { sendPushNotification } from '../lib/webpush.js'

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  platform: z.enum(['web', 'ios']).default('web'),
})

const PrefsSchema = z.object({
  weightReminder: z.object({ enabled: z.boolean(), time: z.string().optional() }).optional(),
  foodReminder: z.object({ enabled: z.boolean(), time: z.string().optional() }).optional(),
  workoutReminder: z.object({ enabled: z.boolean() }).optional(),
  calorieWarning: z.object({ enabled: z.boolean() }).optional(),
})

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  // Return VAPID public key so the frontend can subscribe
  fastify.get('/vapid-key', async () => ({
    publicKey: process.env.VAPID_PUBLIC_KEY ?? null,
  }))

  fastify.post('/subscribe', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = SubscribeSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid subscription payload' })

    await prisma.pushSubscription.upsert({
      where: { endpoint: body.data.endpoint },
      update: {
        p256dh: body.data.keys.p256dh,
        auth: body.data.keys.auth,
        platform: body.data.platform,
        userId: request.user.userId,
      },
      create: {
        userId: request.user.userId,
        endpoint: body.data.endpoint,
        p256dh: body.data.keys.p256dh,
        auth: body.data.keys.auth,
        platform: body.data.platform,
      },
    })

    return { ok: true }
  })

  fastify.delete('/subscribe', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = z.object({ endpoint: z.string() }).safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Missing endpoint' })

    await prisma.pushSubscription.deleteMany({
      where: { userId: request.user.userId, endpoint: body.data.endpoint },
    })

    return { ok: true }
  })

  fastify.put('/preferences', { onRequest: [fastify.authenticate] }, async (request) => {
    const body = PrefsSchema.safeParse(request.body)
    if (!body.success) return { ok: false }

    await prisma.userProfile.update({
      where: { userId: request.user.userId },
      data: { notificationPrefs: body.data },
    })

    return { ok: true }
  })

  fastify.get('/preferences', { onRequest: [fastify.authenticate] }, async (request) => {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: request.user.userId },
      select: { notificationPrefs: true },
    })
    return profile?.notificationPrefs ?? {}
  })

  // Send a test push to all of the user's subscriptions
  fastify.post('/test', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: request.user.userId },
    })

    if (subs.length === 0) {
      return reply.status(404).send({ error: 'No push subscriptions found — enable notifications first' })
    }

    const results = await Promise.allSettled(
      subs.map((sub) =>
        sendPushNotification(sub, {
          title: 'FitSelf',
          body: 'Push notifications are working!',
          icon: '/icons/icon-192.png',
          tag: 'test',
        })
      )
    )

    // Remove any subscriptions that returned a 410 (Gone — browser unsubscribed)
    const gone: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const err = r.reason as { statusCode?: number }
        if (err?.statusCode === 410) gone.push(subs[i].endpoint)
      }
    })
    if (gone.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: gone } } })
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return { ok: true, sent, total: subs.length }
  })
}

export default notificationRoutes
