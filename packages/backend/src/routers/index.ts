import { taskRouter } from './task.js'
import { router } from '../trpc.js'

export const appRouter = router({
  task: taskRouter,
})

export type AppRouter = typeof appRouter
