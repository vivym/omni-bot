import amqp from 'amqplib'
import { ITaskInQueue } from '../models/task.js'

let conn: amqp.Connection | null = null
let pendingTaskSenderChannel: amqp.Channel | null = null

export async function connectAMQP() {
  const { AMQP_URI } = process.env

  if (!AMQP_URI) {
    throw new Error('AMQP_URI is not defined')
  }

  conn = await amqp.connect(AMQP_URI)

  pendingTaskSenderChannel = await conn.createChannel()
  await pendingTaskSenderChannel.assertQueue('pendingTasks', { durable: true })
}

export function pushPendingTask(task: ITaskInQueue) {
  if (!pendingTaskSenderChannel) {
    throw new Error('pendingTaskSenderChannel is not defined')
  }

  pendingTaskSenderChannel.sendToQueue(
    'pendingTasks',
    Buffer.from(JSON.stringify(task)),
    { persistent: true },
  )
}

export async function subscribeCompletedTasks(
  emit: (data: ITaskInQueue) => void,
) {
  if (!conn) {
    throw new Error('conn is not defined')
  }

  const channel = await conn.createChannel()
  await channel.assertQueue('completedTasks', { durable: true })
  channel.prefetch(1)

  channel.consume('completedTasks', (msg) => {
    if (msg) {
      const task: ITaskInQueue = JSON.parse(msg.content.toString())
      emit(task)
      channel.ack(msg)
    }
  })

  return () => {
    channel.close()
  }
}
