import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import { context as taskContext } from './models/task.js'

export function createContext({ req, res }: CreateFastifyContextOptions) {
  const token = req.headers.authorization?.split(' ')[1]

  return {
    req,
    res,
    token,
    ...taskContext,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
