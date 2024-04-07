import { Command } from '@sapphire/framework'
import { type ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import { checkChannelPermissions } from '../lib/permissions/checkPermissions'

export class BouncerSetupCommand extends Command {
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
          command.setName('show-status').setDescription('Show the bouncer\'s current status.')
        )
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
        )
        .addSubcommand((command) =>
          command.setName('enable').setDescription('Enable the bouncer for this server.')
        )
        .addSubcommand((command) =>
          command.setName('disable').setDescription('Disable the bouncer for this server.')
        )
        .addSubcommand((command) =>
          command.setName('reset').setDescription('Resets all settings to their default values.')
        )
    , {
      idHints: ['1216082943433506887']
    })
  }

  public async chatInputRun (interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand()

    if (subcommand === 'show-status') {
      const embed = await this.makeChannelsEmbed(interaction.guild!.id)
      return await interaction.reply({ embeds: [embed], ephemeral: true })
    }

    // Voice channels
    if (subcommand === 'set-private-vc' || subcommand === 'set-waiting-vc') {
      await this.setVoiceChannels(interaction)
    }

    // Text channel
    if (subcommand === 'set-text-channel') {
      await this.setTextChannel(interaction)
    }

    if (subcommand === 'enable') {
      await this.enableBouncer(interaction.guild!.id, interaction)
    }

    if (subcommand === 'disable') {
      await this.disableBouncer(interaction.guild!.id, interaction)
    }

    if (subcommand === 'reset') {
      await this.resetBouncer(interaction.guild!.id, interaction)
    }
  }

  private readonly setVoiceChannels = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const channel = interaction.options.getChannel('voice-channel', true)
    const subcommand = interaction.options.getSubcommand()

    // First check if bot has permissions to connect to the channel, speak, and move members
    const hasPermissions = await checkChannelPermissions(interaction.guild!.id, channel.id, ['Connect', 'Speak', 'MoveMembers'])
    // Error checking permissions
    if (hasPermissions === false) {
      await interaction.reply({ content: 'Error checking channel permissions.', ephemeral: true })
    }
    // Bot lacks one or multiple permissions
    if (Array.isArray(hasPermissions) && hasPermissions.length > 0) {
      await interaction.reply({ content: 'I do not have permission(s) to perform this action.\nMissing permissions: `' + hasPermissions.join(', ') + '`', ephemeral: true })
    }

    // Voice channels
    if (subcommand === 'set-private-vc') {
      const updated = await guildHandler.updateGuildPrivateVcId(interaction.guild!.id, channel.id)

      if (!updated) {
        await interaction.reply({ content: 'Error updating the private voice channel.', ephemeral: true })
      } else {
        await interaction.reply({ content: `The private channel has been updated to <#${channel.id}>.`, ephemeral: true })
      }
    } else {
      const updated = await guildHandler.updateGuildWaitingVcId(interaction.guild!.id, channel.id)

      if (!updated) {
        await interaction.reply({ content: 'Error updating the waiting room voice channel.', ephemeral: true })
      } else {
        await interaction.reply({ content: `The waiting room channel has been updated to <#${channel.id}>.`, ephemeral: true })
      }
    }
  }

  private readonly setTextChannel = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const channel = interaction.options.getChannel('text-channel', true)

    // First check if bot has permissions to read and send messages to the channel
    const hasPermissions = await checkChannelPermissions(interaction.guild!.id, channel.id, ['ViewChannel', 'SendMessages'])
    // Error checking permissions
    if (hasPermissions === false) {
      await interaction.reply({ content: 'Error checking channel permissions.', ephemeral: true })
    }
    // Bot lacks one or multiple permissions
    if (Array.isArray(hasPermissions) && hasPermissions.length > 0) {
      await interaction.reply({ content: 'I do not have permission(s) to perform this action.\nMissing permissions: `' + hasPermissions.join(', ') + '`', ephemeral: true })
    }

    const updated = await guildHandler.updateGuildTextChannelId(interaction.guild!.id, channel.id)
    if (!updated) {
      await interaction.reply({ content: 'Error updating the text channel.', ephemeral: true })
    } else {
      await interaction.reply({ content: `The text channel has been updated to <#${channel.id}>.`, ephemeral: true })
    }
  }

  private readonly enableBouncer = async (guildId: string, interaction: ChatInputCommandInteraction): Promise<void> => {
    // Check that all channels have been set up
    if (!await guildHandler.checkAllChannelsAreSetUp(guildId)) {
      await interaction.reply({ content: 'All channels must be set up before enabling the bouncer.', ephemeral: true })
    }
    const updated = await guildHandler.toggleGuildBouncer(guildId, true)
    if (!updated) {
      await interaction.reply({ content: 'Error updating the bouncer status.', ephemeral: true })
    } else {
      await interaction.reply({ content: 'The bouncer has been enabled for this server.', ephemeral: true })
    }
  }

  private readonly disableBouncer = async (guildId: string, interaction: ChatInputCommandInteraction): Promise<void> => {
    const updated = await guildHandler.toggleGuildBouncer(guildId, false)
    if (!updated) {
      await interaction.reply({ content: 'Error updating the bouncer status.', ephemeral: true })
    } else {
      await interaction.reply({ content: 'The bouncer has been disabled for this server.', ephemeral: true })
    }
  }

  private readonly resetBouncer = async (guildId: string, interaction: ChatInputCommandInteraction): Promise<void> => {
    const updated = await guildHandler.resetGuildBouncer(guildId)
    if (!updated) {
      await interaction.reply({ content: 'Error resetting the bouncer status.', ephemeral: true })
    } else {
      await interaction.reply({ content: 'The bouncer has been reset for this server.', ephemeral: true })
    }
  }

  private readonly makeChannelsEmbed = async (guildId: string): Promise<EmbedBuilder> => {
    const privateVcId = await guildHandler.getGuildPrivateVcId(guildId)
    const waitingVcId = await guildHandler.getGuildWaitingVcId(guildId)
    const textChannelId = await guildHandler.getGuildTextChannelId(guildId)

    const embed = new EmbedBuilder()
      .setTitle('Bouncer Status')
      .setColor('Blurple')
      .setDescription('Channels:')
      .addFields(
        { name: 'Private voice channel', value: `${privateVcId != null ? `<#${privateVcId}>` : 'Set it using /bouncersetup set-private-vc'}` },
        { name: 'Waiting room voice channel', value: `${waitingVcId != null ? `<#${waitingVcId}>` : 'Set it using /bouncersetup set-waiting-vc'}` },
        { name: 'Text channel', value: `${textChannelId != null ? `<#${textChannelId}>` : 'Set it using /bouncersetup set-text-channel'}` },
        { name: 'Status', value: `${await guildHandler.getGuildBouncerStatus(guildId) ? ':white_check_mark: Enabled' : ':x: Disabled'}` }
      )

    return embed
  }
}
