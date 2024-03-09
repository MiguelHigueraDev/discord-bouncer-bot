import { Command } from '@sapphire/framework'
import { type ChatInputCommandInteraction, PermissionFlagsBits, type InteractionResponse, ChannelType } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import { checkChannelPermissions } from '../lib/permissions/checkPermissions'

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
      idHints: ['1216082943433506887']
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

      // First check if bot has permissions to connect to the channel and talk
      const hasPermissions = await checkChannelPermissions(interaction.guild.id, channel.id, ['Connect', 'Speak'])
      // Error checking permissions
      if (hasPermissions === false) {
        return await interaction.reply({ content: 'Error checking channel permissions.', ephemeral: true })
      }
      // Bot lacks one or multiple permissions
      if (hasPermissions !== true) {
        return await interaction.reply({ content: 'I do not have permissions to connect to this channel.\nMissing permissions: `' + hasPermissions.join(', ') + '`', ephemeral: true })
      }

      if (subcommand === 'set-private-vc') {
        const updated = await guildHandler.updateGuildPrivateVc(interaction.guild.id, channel.id)

        if (!updated) {
          return await interaction.reply({ content: 'Error updating the private voice channel.', ephemeral: true })
        } else {
          return await interaction.reply({ content: `The private channel has been updated to <#${channel.id}>.`, ephemeral: true })
        }
      } else {
        const updated = await guildHandler.updateGuildWaitingVc(interaction.guild.id, channel.id)

        if (!updated) {
          return await interaction.reply({ content: 'Error updating the waiting room voice channel.', ephemeral: true })
        } else {
          return await interaction.reply({ content: `The waiting room channel has been updated to <#${channel.id}>.`, ephemeral: true })
        }
      }
    }

    // Text channel
    if (subcommand === 'set-text-channel') {
      const channel = interaction.options.getChannel('text-channel', true)

      // First check if bot has permissions to read and send messages to the channel
      const hasPermissions = await checkChannelPermissions(interaction.guild.id, channel.id, ['ViewChannel', 'SendMessages'])
      // Error checking permissions
      if (hasPermissions === false) {
        return await interaction.reply({ content: 'Error checking channel permissions.', ephemeral: true })
      }
      // Bot lacks one or multiple permissions
      if (hasPermissions !== true) {
        return await interaction.reply({ content: 'I do not have permissions to read and send messages to this channel.\nMissing permissions: `' + hasPermissions.join(', ') + '`', ephemeral: true })
      }

      const updated = await guildHandler.updateGuildTextChannel(interaction.guild.id, channel.id)
      if (!updated) {
        return await interaction.reply({ content: 'Error updating the text channel.', ephemeral: true })
      } else {
        return await interaction.reply({ content: `The text channel has been updated to <#${channel.id}>.`, ephemeral: true })
      }
    }

    return await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true })
  }
}
