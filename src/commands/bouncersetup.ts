import { Command } from '@sapphire/framework'
import { type ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, EmbedBuilder, InteractionContextType, MessageFlags, InteractionResponse } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import { checkChannelPermissions } from '../lib/permissions/checkPermissions'

export class BouncerSetupCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'bouncersetup',
      description: 'Setup the bouncer bot'
    })
  }

  public override registerApplicationCommands(registry: Command.Registry): void {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setContexts(InteractionContextType.Guild)
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
    )
  }

  public async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void | InteractionResponse> {
    const subcommand = interaction.options.getSubcommand()
    const guildId = interaction.guild!.id

    try {
      switch (subcommand) {
        case 'show-status':
          const embed = await this.makeChannelsEmbed(guildId)
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
  
        case 'set-private-vc':
        case 'set-waiting-vc':
          return await this.setVoiceChannels(interaction)
  
        case 'set-text-channel':
          return await this.setTextChannel(interaction)
  
        case 'enable':
          return await this.enableBouncer(guildId, interaction)
  
        case 'disable':
          return await this.disableBouncer(guildId, interaction)
  
        case 'reset':
          return await this.resetBouncer(guildId, interaction)
  
        default:
          return await interaction.reply({
            content: 'Unknown subcommand',
            flags: MessageFlags.Ephemeral
          })
      }
    } catch (error) {
      console.error(`Error executing ${subcommand}:`, error)
      return await interaction.reply({
        content: 'An unexpected error occurred while processing your command.',
        flags: MessageFlags.Ephemeral
      }).catch(() => {})
    }
  }

  /**
   * Check permissions for a channel and respond with error if needed
   * @returns true if permissions check passed, false if already responded with error
   */
  private async checkAndRespondPermissions(
    interaction: ChatInputCommandInteraction, 
    channelId: string, 
    permissions: string[]
  ): Promise<boolean> {
    const hasPermissions = await checkChannelPermissions(interaction.guild!.id, channelId, permissions)
    
    // Error checking permissions
    if (hasPermissions === false) {
      await interaction.reply({ 
        content: 'Error checking channel permissions.', 
        flags: MessageFlags.Ephemeral 
      })
      return false
    }
    
    // Bot lacks one or multiple permissions
    if (Array.isArray(hasPermissions) && hasPermissions.length > 0) {
      await interaction.reply({ 
        content: `I do not have permission(s) to perform this action.\nMissing permissions: \`${hasPermissions.join(', ')}\``, 
        flags: MessageFlags.Ephemeral 
      })
      return false
    }
    
    return true
  }

  private async setVoiceChannels(interaction: ChatInputCommandInteraction): Promise<void> {
    const channel = interaction.options.getChannel('voice-channel', true)
    const subcommand = interaction.options.getSubcommand()

    // Check required permissions
    if (!await this.checkAndRespondPermissions(
      interaction, 
      channel.id, 
      ['Connect', 'Speak', 'MoveMembers']
    )) {
      return
    }

    // Update appropriate channel based on subcommand
    const isPrivate = subcommand === 'set-private-vc'
    const updated = isPrivate
      ? await guildHandler.updateGuildPrivateVcId(interaction.guild!.id, channel.id)
      : await guildHandler.updateGuildWaitingVcId(interaction.guild!.id, channel.id)

    if (!updated) {
      const channelType = isPrivate ? 'private voice' : 'waiting room voice'
      await interaction.reply({ 
        content: `Error updating the ${channelType} channel.`, 
        flags: MessageFlags.Ephemeral 
      })
      return
    }

    const channelLabel = isPrivate ? 'private' : 'waiting room'
    await interaction.reply({ 
      content: `The ${channelLabel} channel has been updated to <#${channel.id}>.`, 
      flags: MessageFlags.Ephemeral 
    })
  }

  private async setTextChannel(interaction: ChatInputCommandInteraction): Promise<void> {
    const channel = interaction.options.getChannel('text-channel', true)

    // Check required permissions
    if (!await this.checkAndRespondPermissions(
      interaction, 
      channel.id, 
      ['ViewChannel', 'SendMessages']
    )) {
      return
    }

    const updated = await guildHandler.updateGuildTextChannelId(interaction.guild!.id, channel.id)
    
    if (!updated) {
      await interaction.reply({ 
        content: 'Error updating the text channel.', 
        flags: MessageFlags.Ephemeral 
      })
      return
    }
    
    await interaction.reply({ 
      content: `The text channel has been updated to <#${channel.id}>.`, 
      flags: MessageFlags.Ephemeral 
    })
  }

  private async enableBouncer(guildId: string, interaction: ChatInputCommandInteraction): Promise<void> {
    // Check that all channels have been set up
    if (!await guildHandler.checkAllChannelsAreSetUp(guildId)) {
      await interaction.reply({ 
        content: 'All channels must be set up before enabling the bouncer.', 
        flags: MessageFlags.Ephemeral 
      })
      return
    }
    
    const updated = await guildHandler.toggleGuildBouncer(guildId, true)
    
    if (!updated) {
      await interaction.reply({ 
        content: 'Error updating the bouncer status.', 
        flags: MessageFlags.Ephemeral 
      })
      return
    }
    
    await interaction.reply({ 
      content: 'The bouncer has been enabled for this server.', 
      flags: MessageFlags.Ephemeral 
    })
  }

  private async disableBouncer(guildId: string, interaction: ChatInputCommandInteraction): Promise<void> {
    const updated = await guildHandler.toggleGuildBouncer(guildId, false)
    
    if (!updated) {
      await interaction.reply({ 
        content: 'Error updating the bouncer status.', 
        flags: MessageFlags.Ephemeral 
      })
      return
    }
    
    await interaction.reply({ 
      content: 'The bouncer has been disabled for this server.', 
      flags: MessageFlags.Ephemeral 
    })
  }

  private async resetBouncer(guildId: string, interaction: ChatInputCommandInteraction): Promise<void> {
    const updated = await guildHandler.resetGuildBouncer(guildId)
    
    if (!updated) {
      await interaction.reply({ 
        content: 'Error resetting the bouncer status.', 
        flags: MessageFlags.Ephemeral 
      })
      return
    }
    
    await interaction.reply({ 
      content: 'The bouncer has been reset for this server.', 
      flags: MessageFlags.Ephemeral 
    })
  }

  private async makeChannelsEmbed(guildId: string): Promise<EmbedBuilder> {
    const [privateVcId, waitingVcId, textChannelId, isEnabled] = await Promise.all([
      guildHandler.getGuildPrivateVcId(guildId),
      guildHandler.getGuildWaitingVcId(guildId),
      guildHandler.getGuildTextChannelId(guildId),
      guildHandler.getGuildBouncerStatus(guildId)
    ])

    return new EmbedBuilder()
      .setTitle('Bouncer Status')
      .setColor('Blurple')
      .setDescription('Channels:')
      .addFields(
        { 
          name: 'Private voice channel', 
          value: privateVcId ? `<#${privateVcId}>` : 'Set it using /bouncersetup set-private-vc'
        },
        { 
          name: 'Waiting room voice channel', 
          value: waitingVcId ? `<#${waitingVcId}>` : 'Set it using /bouncersetup set-waiting-vc'
        },
        { 
          name: 'Text channel', 
          value: textChannelId ? `<#${textChannelId}>` : 'Set it using /bouncersetup set-text-channel'
        },
        { 
          name: 'Status', 
          value: isEnabled ? ':white_check_mark: Enabled' : ':x: Disabled'
        }
      )
  }
}
