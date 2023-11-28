import { ApplyOptions } from '@sapphire/decorators'
import { Command } from '@sapphire/framework'
import { trpc } from '../libs/trpc.js'

@ApplyOptions<Command.Options>({
  description: 'Create videos with OmniAI',
})
export class ImagineCommand extends Command {
  // Register Chat Input and Context Menu command
  public override registerApplicationCommands(registry: Command.Registry) {
    // Register Chat Input command
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option //
            .setName('prompt')
            .setDescription('Describe the video you want to create')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option //
            .setName('style_prompt')
            .setDescription('Describe the style you want to use')
            .setChoices(
              { name: 'None', value: 'none' },
              { name: 'Chinese Painting', value: 'Chinese painting style' },
              { name: 'Oil Painting', value: 'oil painting style' },
              { name: 'Cyberpunk', value: 'cyberpunk style' },
            )
            .setRequired(true),
        )
        .addAttachmentOption((option) =>
          option //
            .setName('ref_image')
            .setDescription('Image to use as a reference')
            .setRequired(false),
        )
        .addStringOption((option) =>
          option //
            .setName('negative_prompt')
            .setDescription('What you do not want to see in the video')
            .setRequired(false),
        )
        .addNumberOption((option) =>
          option //
            .setName('seed')
            .setDescription('Seed for the random number generator')
            .setRequired(false),
        ),
    )
  }

  // Chat Input (slash) command
  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    return this.enqueueTask(interaction)
  }

  private async enqueueTask(interaction: Command.ChatInputCommandInteraction) {
    const prompt = interaction.options.getString('prompt', true)
    const stylePrompt = interaction.options.getString('style_prompt', true)
    const refImage = interaction.options.getAttachment('ref_image', false)
    const negativePrompt = interaction.options.getString(
      'negative_prompt',
      false,
    )
    const seed =
      interaction.options.getNumber('seed', false) ||
      Math.ceil(Math.random() * 1000000 + 1)

    interaction.id

    const { task } = await trpc.task.pushPendingTask.mutate({
      channelId: interaction.channelId,
      userId: interaction.user.id,
      msgId: interaction.id,
      prompt: prompt,
      stylePrompt: stylePrompt,
      refImage: refImage?.url,
      negativePrompt: negativePrompt || undefined,
      seed,
    })

    await interaction.reply({
      content: `We are working on your video. We will notify you when it is ready. Task ID: ${task._id}`,
      ephemeral: true,
    })
  }
}
