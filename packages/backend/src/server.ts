import ws from '@fastify/websocket'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import fastify from 'fastify'
import { appRouter } from './routers/index.js'
import { createContext } from './context.js'

export function createServer() {
  const dev = process.env.NODE_ENV !== 'production'

  const server = fastify({ logger: dev })

  server.register(ws)

  server.register(fastifyTRPCPlugin, {
    prefix: '/api/trpc',
    useWSS: true,
    trpcOptions: { router: appRouter, createContext },
  })

  server.get('/ping', async () => {
    return 'pong'
  })

  const start = async () => {
    try {
      await server.listen({ port: 3000 })
      console.log('server listening on', server.server.address())
    } catch (err) {
      server.log.error(err)
      process.exit(1)
    }
  }
  const stop = async () => {
    await server.close()
  }

  return { server, start, stop }
}
