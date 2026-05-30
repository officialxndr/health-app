import fp from 'fastify-plugin'
// fastify-plugin wraps the plugin so decorations are available on the parent scope
import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string }
    user: { userId: string; email: string }
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: any) => {
    try {
      await request.jwtVerify()
      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { id: true },
      })
      if (!user) {
        reply.status(401).send({ error: 'Unauthorized' })
      }
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })
}

export default fp(authPlugin)
