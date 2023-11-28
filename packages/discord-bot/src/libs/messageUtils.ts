import type { ITaskInQueue } from '../../../backend/src/models/task.js'

export function formatGenerationResultMessage(task: ITaskInQueue) {
  if (!task.result) {
    return `Something went wrong with task ID: ${task.id}. <@${task.userId}>`
  }

  let msg = `New generation from <@${task.userId}>:\nTask ID: ${task.id}\nPrompt: ${task.prompt}\n`

  if (task.refImage) {
    msg += `Ref Image: ${task.refImage}\n`
  }

  if (task.negativePrompt) {
    msg += `Negative Prompt: ${task.negativePrompt}\n`
  }

  msg += `Style Prompt: ${task.stylePrompt}\nSeed: ${task.seed}`

  return msg
}
