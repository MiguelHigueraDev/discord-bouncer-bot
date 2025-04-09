/**
 * This one handles all the users joining the waiting channel (users)
 * It sends notifications and moves members automatically
 */
import { Listener } from '@sapphire/framework'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, type VoiceBasedChannel, type GuildMember, type Message, type VoiceState, type User, type GuildTextBasedChannel } from 'discord.js'
import { type GuildChannels } from '../lib/interfaces/GuildChannels'
import voiceStoresManager from '../lib/helpers/voiceStoresManager'
import sessionManager from '../lib/helpers/sessionManager'
import audioManager from '../lib/audio/audioManager'

type ActionType = 'moved' | 'remembered' | 'ignored'

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

    // Check if user is ignored and return early if it is
    if (voiceStoresManager.checkIfUserIsIgnored(user.id, guildId)) return

    // Get current session and channels
    const session = sessionManager.getSession(guildId)
    // Session is not running here. Return early.
    if (session == null) return

    const guildChannels: GuildChannels = session.channels
    const { privateVcId, waitingVcId, textChannelId } = guildChannels

    // Check if joined channel is waiting room for this server
    if (waitingVcId === joinedChannel) {
      // Check if private channel is not empty
      const privateChannel = await newState.guild.channels.fetch(privateVcId) as VoiceBasedChannel
      if (privateChannel == null) return
      if (privateChannel.members.size === 0) return
      // Check if user is stored in remembered users for the session, if stored just move user to private channel
      if (voiceStoresManager.checkIfUserIsRemembered(user.id, guildId)) {
        return await user.voice.setChannel(privateVcId)
      }

      // Check if user is in cooldown
      if (voiceStoresManager.checkIfUserIsInCooldown(user.id, guildId)) return

      // Set cooldown for user and guild
      voiceStoresManager.setCooldown(user.id, guildId)
      // Send message to text channel
      const textChannel = await newState.guild.channels.fetch(textChannelId)
      if (textChannel == null) return
      if (textChannel.isTextBased()) {
        // Send join request and handle button clicks
        await this.sendJoinRequestToTextChannel(textChannel, guildChannels, user)
        // Get voice channel and send audio notification
        const voiceChannel = await newState.guild.channels.fetch(privateVcId)
        await audioManager.sendAudioNotification(voiceChannel as VoiceBasedChannel)
      }
    }
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
   * Creates and returns an updated EmbedBuilder for a join request.
   * This includes the action performed on the member and the person who performed it
   *
   * @param {User} user - the user
   * @param {ActionType} action - the action taken on the user
   * @param {User} executor - the user who performed the action
   * @return {EmbedBuilder} the embed builder for the join request with the action taken and the user responsible for it
   */
  private makeUpdatedEmbed (user: User, action: ActionType, executor: User): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor('Blurple')
      .setTitle('Join Request')
      .setDescription(`<@${user.id}> was ${action} by <@${executor.id}>.`)
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `Requested by ${user.username}` })
    return embed
  }

  /**
   * Create and return a new ActionRowBuilder with three buttons: move, remember, and ignore.
   *
   * @param {boolean} isDisabled - whether the buttons should be disabled
   * @return {ActionRowBuilder<ButtonBuilder>} The newly created ActionRowBuilder with the three buttons.
   */
  private makeButtons (isDisabled: boolean = false): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>()
    const moveButton = new ButtonBuilder().setCustomId('moved').setStyle(ButtonStyle.Primary).setLabel('Move').setDisabled(isDisabled)
    const rememberButton = new ButtonBuilder().setCustomId('remembered').setStyle(ButtonStyle.Success).setLabel('Move + remember').setDisabled(isDisabled)
    const ignoreButton = new ButtonBuilder().setCustomId('ignored').setStyle(ButtonStyle.Danger).setLabel('Ignore for this session').setDisabled(isDisabled)

    row.addComponents(moveButton, rememberButton, ignoreButton)
    return row
  }

  /**
   * Send a join request to a text channel if it is text-based.
   *
   * @param {GuildTextBasedChannel} textChannel - the text channel to send the join request to
   * @param {GuildChannels} guildChannels - the guild channels
   * @param {GuildMember} user - the user object
   * @return {Promise<void>} a promise that resolves once the join request is sent
   */
  private async sendJoinRequestToTextChannel (textChannel: GuildTextBasedChannel, guildChannels: GuildChannels, user: GuildMember) {
    const embed = this.makeEmbed(guildChannels, user)
    const buttonRow = this.makeButtons()
    const message = await textChannel.send({ embeds: [embed], components: [buttonRow] })

    await this.handleCollector(message, guildChannels, user)
  }

  private async handleCollector (message: Message, guildChannels: GuildChannels, user: GuildMember) {
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 900_000 })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    collector.on('collect', async (interaction) => {
      collector.stop()
      try {
        if (interaction.customId === 'moved') {
          // Clear cooldown for user and move it to the channel
          voiceStoresManager.clearCooldown(user.id, user.guild.id)
          await user.voice.setChannel(guildChannels.privateVcId)
          await interaction.reply({ content: 'User moved to private VC.', ephemeral: true })
        } else if (interaction.customId === 'remembered') {
          // Set user as remembered, clear cooldown and move them to the channel
          voiceStoresManager.setRememberedUser(user.id, user.guild.id)
          voiceStoresManager.clearCooldown(user.id, user.guild.id)
          await user.voice.setChannel(guildChannels.privateVcId)
          await interaction.reply({ content: 'User moved to private VC and remembered for current session.', ephemeral: true })
        } else if (interaction.customId === 'ignored') {
          // Ignore user for current session
          voiceStoresManager.setIgnoredUser(user.id, user.guild.id)
          await interaction.reply({ content: 'User ignored for current session.', ephemeral: true })
        }
        // Update embed with action taken and executor
        const updatedEmbed = this.makeUpdatedEmbed(user.user, interaction.customId as ActionType, interaction.user)
        await message.edit({ embeds: [updatedEmbed] })
      } catch (error) {
        await interaction.reply({ content: 'Error moving user to private VC. If they haven\'t left the VC, check that I have permissions to connect to the VC and to move members.', ephemeral: true })
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    collector.on('end', async () => {
      await message.edit({ components: [this.makeButtons(true)] })
    })
  }
}
