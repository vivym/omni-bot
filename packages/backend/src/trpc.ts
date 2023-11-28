import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { Context } from './context.js'

const trpc = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = trpc.router
export const publicProcedure = trpc.procedure
