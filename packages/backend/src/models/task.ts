import mongoose, { Schema } from 'mongoose'

export interface ITask {
  channelId: string
  userId: string
  interactionId: string
  prompt: string
  stylePrompt?: string
  refImage?: string | undefined
  negativePrompt?: string | undefined
  seed: number
}

export interface ITaskDocment extends ITask {
  status: 'pending' | 'processing' | 'completed'
  result?: string | undefined
  completedAt?: Date | undefined
}

export interface ITaskWithID extends ITask {
  id: string
}

export interface ITaskInQueue extends ITaskWithID {
  result?: string | undefined
  completedAt?: Date | undefined
}

const taskSchema = new Schema<ITaskDocment>(
  {
    channelId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    interactionId: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    stylePrompt: {
      type: String,
      required: true,
    },
    refImage: {
      type: String,
      required: false,
    },
    negativePrompt: {
      type: String,
      required: false,
    },
    seed: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
    },
    result: {
      type: String,
      required: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true },
)

export const TaskModel =
  mongoose.models && mongoose.models.Task
    ? (mongoose.models.Task as mongoose.Model<ITaskDocment>)
    : mongoose.model<ITaskDocment>('Task', taskSchema)

export const context = {
  task: {
    create: async (task: ITask) => {
      const taskDoc = new TaskModel(task)
      await taskDoc.save()
      return taskDoc
    },
    pop: async () => {
      return await TaskModel.findOneAndUpdate(
        { status: 'pending' },
        { status: 'processing' },
        { sort: { createdAt: 1 } },
      )
    },
  },
}

export default TaskModel
