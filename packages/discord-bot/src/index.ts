import 'dotenv/config'
import './polyfill.js'
import {
  ApplicationCommandRegistries,
  RegisterBehavior,
  LogLevel,
  SapphireClient,
} from '@sapphire/framework'
import '@sapphire/plugin-logger/register'
import { createColors } from 'colorette'
import { GatewayIntentBits } from 'discord.js'
import { trpc, closeTRPCClient } from './libs/trpc.js'
import { formatGenerationResultMessage } from './libs/messageUtils.js'

async function main() {
  createColors({ useColor: true })

  // Set default behavior to bulk overwrite
  ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
    RegisterBehavior.BulkOverwrite,
  )

  const client = new SapphireClient({
    defaultPrefix: '!',
    caseInsensitiveCommands: true,
    logger: {
      level: LogLevel.Debug,
    },
    intents: [
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.MessageContent,
    ],
    loadMessageCommandListeners: true,
  })

  let sub = null

  try {
    client.logger.info('Logging in...')
    await client.login()
    client.logger.info('Logged in!')

    sub = trpc.task.subscribeCompletedTasks.subscribe(undefined, {
      async onData({ task }) {
        const channel = await client.channels.fetch(task.channelId)
        if (!channel || !channel.isTextBased()) {
          return
        }
        const content = formatGenerationResultMessage(task)
        const files = []
        if (task.result) {
          files.push(task.result)
        }
        await channel.send({
          content: content,
          allowedMentions: { users: [task.userId] },
          files,
        })
      },
      onError(error) {
        client.logger.error('trpc::task::subscribeCompletedTasks error:', error)
      },
      onComplete() {
        client.logger.info('trpc::task::subscribeCompletedTasks unsubscribed')
      },
    })
  } catch (error) {
    client.logger.fatal(error)
    client.destroy()
    sub?.unsubscribe()
    closeTRPCClient()
    process.exit(1)
  }
}

main().catch(console.error)
