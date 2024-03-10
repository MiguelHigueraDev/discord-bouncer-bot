/**
 * This one handles all the users joining the waiting channel (users)
 * It sends notifications and moves members automatically
 */
import { Listener } from '@sapphire/framework'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, type VoiceBasedChannel, type GuildMember, type Message, type TextBasedChannel, type VoiceState } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import { type GuildChannels } from '../lib/interfaces/GuildChannels'
import voiceStoresManager from '../lib/helpers/voiceStoresManager'
import sessionManager from '../lib/helpers/sessionManager'
import audioManager from '../lib/audio/audioManager'

export class UsersVoiceStateUpdateListener extends Listener {
  public constructor (context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate'
    })
  }

  public async run (oldState: VoiceState, newState: VoiceState) {
    const joinedChannel = newState.channelId
    const guildId = newState.guild.id
    const user = newState.member!

    // Check if session exists for this guild
    if (!sessionManager.checkIfSessionExists(guildId)) return

    // Check if user is ignored and return early if it is
    if (voiceStoresManager.checkIfUserIsIgnored(user.id, guildId)) return

    const guildWaitingVc = await guildHandler.getGuildWaitingVc(guildId)
    const guildTextChannel = await guildHandler.getGuildTextChannel(guildId)
    const guildPrivateVc = await guildHandler.getGuildPrivateVc(guildId)

    // Check that all three channels are set up
    if (guildPrivateVc == null || guildWaitingVc == null || guildTextChannel == null) return

    const guildChannels: GuildChannels = {
      privateVcId: guildPrivateVc,
      waitingVcId: guildWaitingVc,
      textChannelId: guildTextChannel
    }

    // Check if this guild has the bouncer enabled
    if (!await this.checkIfGuildIsValid(guildId)) return

    // Check if joined channel is waiting room for this server
    if (guildWaitingVc === joinedChannel) {
      // Check if private channel is not empty
      const privateChannel = await newState.guild.channels.fetch(guildPrivateVc) as VoiceBasedChannel
      if (privateChannel == null) return
      if (privateChannel.members.size === 0) return
      // Check if user is stored in remembered users for the session
      // If stored, just move user to it
      if (voiceStoresManager.checkIfUserIsRemembered(user.id, guildId)) {
        return await user.voice.setChannel(guildPrivateVc)
      }

      // Check if user is in cooldown
      if (voiceStoresManager.checkIfUserIsInCooldown(user.id, guildId)) return

      // Set cooldown for user and guild
      voiceStoresManager.setCooldown(user.id, guildId)
      // Send message to text channel
      const textChannel = await newState.guild.channels.fetch(guildTextChannel)
      if (textChannel == null) return
      if (textChannel.isTextBased()) {
        // Send join request and handle button clicks
        await this.sendJoinRequestToTextChannel(textChannel, guildChannels, user)
        // Get voice channel and send audio notification
        const voiceChannel = await newState.guild.channels.fetch(guildPrivateVc)
        await audioManager.sendAudioNotification(voiceChannel as VoiceBasedChannel)
      }
    }
  }

  /**
   * Check if the guild is valid
   * This means: has the bouncer enabled and has all three channels set up
   *
   * @param {string} guildId - The ID of the guild to be checked
   * @return {Promise<boolean>} A boolean indicating if the guild is valid
   */
  private async checkIfGuildIsValid (guildId: string): Promise<boolean> {
    const guildEnabled = await guildHandler.getGuildBouncerStatus(guildId)
    return guildEnabled
  }

  /**
   * Creates and returns an EmbedBuilder for a join request.
   *
   * @param {GuildChannels} guildChannels - the guild channels
   * @param {GuildMember} user - the user
   * @return {EmbedBuilder} the embed builder for the join request
   */
  private makeEmbed (guildChannels: GuildChannels, user: GuildMember): EmbedBuilder {
    const { privateVcId } = guildChannels
    const embed = new EmbedBuilder()
      .setColor('Blurple')
      .setTitle('Join Request')
      .setDescription(`<@${user.id}> wants to join the <#${privateVcId}> channel.`)
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `Requested by ${user.user.username}` })
    return embed
  }

  /**
   * Create and return a new ActionRowBuilder with three buttons: move, remember, and ignore.
   *
   * @return {ActionRowBuilder<ButtonBuilder>} The newly created ActionRowBuilder with the three buttons.
   */
  private makeButtons (): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>()
    const moveButton = new ButtonBuilder().setCustomId('move').setStyle(ButtonStyle.Primary).setLabel('Move')
    const rememberButton = new ButtonBuilder().setCustomId('remember').setStyle(ButtonStyle.Success).setLabel('Move + remember')
    const ignoreButton = new ButtonBuilder().setCustomId('ignore').setStyle(ButtonStyle.Danger).setLabel('Ignore for this session')

    row.addComponents(moveButton, rememberButton, ignoreButton)
    return row
  }

  /**
   * Creates and returns a new action row with disabled buttons.
   *
   * @param None
   * @return {ActionRowBuilder<ButtonBuilder>} The action row with disabled buttons
   */
  private makeDisabledButtons (): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>()
    const moveButton = new ButtonBuilder().setCustomId('move').setStyle(ButtonStyle.Primary).setLabel('Move').setDisabled(true)
    const rememberButton = new ButtonBuilder().setCustomId('remember').setStyle(ButtonStyle.Success).setLabel('Move + remember').setDisabled(true)
    const ignoreButton = new ButtonBuilder().setCustomId('ignore').setStyle(ButtonStyle.Danger).setLabel('Ignore for this session').setDisabled(true)

    row.addComponents(moveButton, rememberButton, ignoreButton)
    return row
  }

  /**
   * Send a join request to a text channel if it is text-based.
   *
   * @param {TextBasedChannel} textChannel - the text channel to send the join request to
   * @param {GuildChannels} guildChannels - the guild channels
   * @param {GuildMember} user - the user object
   * @return {Promise<void>} a promise that resolves once the join request is sent
   */
  private async sendJoinRequestToTextChannel (textChannel: TextBasedChannel, guildChannels: GuildChannels, user: GuildMember) {
    const embed = this.makeEmbed(guildChannels, user)
    const buttonRow = this.makeButtons()
    const message = await textChannel.send({ embeds: [embed], components: [buttonRow] })

    await this.handleCollector(message, guildChannels, user)
  }

  private async handleCollector (message: Message, guildChannels: GuildChannels, user: GuildMember) {
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 900_000 })

    collector.on('collect', async (interaction) => {
      collector.stop()
      try {
        if (interaction.customId === 'move') {
          // Clear cooldown for user
          voiceStoresManager.clearCooldown(user.id, user.guild.id)
          await user.voice.setChannel(guildChannels.privateVcId)
          await interaction.reply({ content: 'User moved to private VC.', ephemeral: true })
        } else if (interaction.customId === 'remember') {
          // Set user as remembered and move them to the channel
          voiceStoresManager.setRememberedUser(user.id, user.guild.id)
          voiceStoresManager.clearCooldown(user.id, user.guild.id)
          await user.voice.setChannel(guildChannels.privateVcId)
          await interaction.reply({ content: 'User moved to private VC and remembered for current session.', ephemeral: true })
        } else if (interaction.customId === 'ignore') {
          // Ignore user for current session
          voiceStoresManager.setIgnoredUser(user.id, user.guild.id)
          await interaction.reply({ content: 'User ignored for current session.', ephemeral: true })
        }
        // Disable buttons
        await message.edit({ components: [this.makeDisabledButtons()] })
      } catch (error) {
        await interaction.reply({ content: 'Error moving user to private VC. If they haven\'t left the VC, check that I have permissions to connect to the VC and to move members.', ephemeral: true })
        await message.edit({ components: [this.makeDisabledButtons()] })
      }
    })
  }
}
