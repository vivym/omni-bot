import { TRPCError } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc.js'
import { ITaskInQueue, TaskModel } from '../models/task.js'
import { pushPendingTask, subscribeCompletedTasks } from '../libs/amqp.js'

export const taskRouter = router({
  pushPendingTask: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        userId: z.string(),
        interactionId: z.string(),
        prompt: z.string(),
        stylePrompt: z.string(),
        refImage: z.string().optional(),
        negativePrompt: z.string().optional(),
        seed: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.token !== process.env.OMNI_AI_TOKEN) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const task = new TaskModel({
        channelId: input.channelId,
        userId: input.userId,
        interactionId: input.interactionId,
        prompt: input.prompt,
        stylePrompt: input.stylePrompt,
        refImage: input.refImage,
        negativePrompt: input.negativePrompt,
        seed: input.seed,
      })
      await task.save()

      await pushPendingTask({
        id: task._id.toString(),
        channelId: task.channelId,
        userId: task.userId,
        interactionId: task.interactionId,
        prompt: task.prompt,
        stylePrompt: task.stylePrompt,
        refImage: task.refImage,
        negativePrompt: task.negativePrompt,
        seed: task.seed,
      })

      return { task }
    }),
  subscribeCompletedTasks: publicProcedure.subscription(() => {
    return observable<{ task: ITaskInQueue }>((emit) => {
      let unsubscribe: (() => void) | null = null

      subscribeCompletedTasks(async (task: ITaskInQueue) => {
        await TaskModel.updateOne(
          { _id: task.id },
          {
            status: 'completed',
            result: task.result,
            completedAt: task.completedAt,
          },
        )
        emit.next({ task })
      })
        .then((unsub) => {
          unsubscribe = unsub
        })
        .catch((err) => emit.error(err))

      return () => unsubscribe?.()
    })
  }),
})
