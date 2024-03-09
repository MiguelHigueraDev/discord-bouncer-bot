import { Command } from '@sapphire/framework'
import { type ChatInputCommandInteraction, PermissionFlagsBits, type InteractionResponse, ChannelType } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'

export class BouncerSetup extends Command {
  public constructor (context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'bouncersetup',
      description: 'Setup the bouncer bot'
    })
  }

  public override registerApplicationCommands (registry: Command.Registry): void {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand((command) =>
          command.setName('set-private-vc').setDescription('Set the voice channel that will be private.')
            .addChannelOption((option) =>
              option
                .setName('voice-channel')
                .setDescription('The voice channel to set as private.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)
            )
        )
        .addSubcommand((command) =>
          command.setName('set-waiting-vc').setDescription('Set the channel that will be the waiting room.')
            .addChannelOption((option) =>
              option
                .setName('voice-channel')
                .setDescription('The voice channel to set as the waiting room.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)
            )
        )
        .addSubcommand((command) =>
          command.setName('set-text-channel').setDescription('Set the text channel where all the join requests will be sent to.')
            .addChannelOption((option) =>
              option
                .setName('text-channel')
                .setDescription('The text channel where all requests will be sent.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
        ), {
      idHints: ['1215894964060422206']
    })
  }

  public async chatInputRun (interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean>> {
    const subcommand = interaction.options.getSubcommand()
    if (subcommand == null) {
      // Show help
    }

    // Check this so typescript doesn't complain about the guild being possibly null
    if (interaction.guild == null) {
      return await interaction.reply({ content: 'Error fetching details from the server.', ephemeral: true })
    }

    // Voice channels
    if (subcommand === 'set-private-vc' || subcommand === 'set-waiting-vc') {
      const channel = interaction.options.getChannel('voice-channel', true)

      if (subcommand === 'set-private-vc') {
        const updated = await guildHandler.updateGuildPrivateVc(interaction.guild.id, channel.id)

        if (!updated) {
          return await interaction.reply({ content: 'Error updating the private voice channel.', ephemeral: true })
        } else {
          return await interaction.reply({ content: 'Private voice channel updated.', ephemeral: true })
        }
      } else {
        const updated = await guildHandler.updateGuildWaitingVc(interaction.guild.id, channel.id)

        if (!updated) {
          return await interaction.reply({ content: 'Error updating the waiting room voice channel.', ephemeral: true })
        } else {
          return await interaction.reply({ content: 'Waiting room voice channel updated.', ephemeral: true })
        }
      }
    }

    // Text channel
    if (subcommand === 'set-text-channel') {
      const channel = interaction.options.getChannel('text-channel', true)

      const updated = await guildHandler.updateGuildTextChannel(interaction.guild.id, channel.id)
      if (!updated) {
        return await interaction.reply({ content: 'Error updating the text channel.', ephemeral: true })
      } else {
        return await interaction.reply({ content: 'Text channel updated.', ephemeral: true })
      }
    }

    return await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true })
  }
}
