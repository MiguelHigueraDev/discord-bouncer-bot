import { Listener } from '@sapphire/framework'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, type GuildMember, type Message, type TextBasedChannel, type VoiceState } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import { type GuildChannels } from '../lib/interfaces/GuildChannels'

export class VoiceStateUpdateListener extends Listener {
  public constructor (context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate'
    })
  }

  public async run (oldState: VoiceState, newState: VoiceState) {
    const joinedChannel = newState.channelId
    const guildId = newState.guild.id
    const guildPrivateVc = await guildHandler.getGuildPrivateVc(guildId)
    const guildWaitingVc = await guildHandler.getGuildWaitingVc(guildId)
    const guildTextChannel = await guildHandler.getGuildTextChannel(guildId)

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
      // Check if user is in cooldown (todo)

      // Send message to text channel and set cooldown for user (todo)
      const textChannel = await newState.guild.channels.fetch(guildTextChannel)
      if (textChannel == null) return
      if (textChannel.isTextBased()) {
        // Send join request and handle button clicks
        await this.sendJoinRequestToTextChannel(textChannel, guildChannels, newState.member!)
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
   * @param {string} userId - the user id
   * @return {EmbedBuilder} the embed builder for the join request
   */
  private makeEmbed (guildChannels: GuildChannels, userId: string): EmbedBuilder {
    const { privateVcId } = guildChannels
    const embed = new EmbedBuilder()
      .setColor('Blurple')
      .setTitle('Join Request')
      .setDescription(`<@${userId}> wants to join the <#${privateVcId}> channel.`)
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
   * @param {string} userId - the user ID
   * @return {Promise<void>} a promise that resolves once the join request is sent
   */
  private async sendJoinRequestToTextChannel (textChannel: TextBasedChannel, guildChannels: GuildChannels, user: GuildMember) {
    const embed = this.makeEmbed(guildChannels, user.id)
    const buttonRow = this.makeButtons()
    const message = await textChannel.send({ embeds: [embed], components: [buttonRow] })

    await this.handleCollector(message, guildChannels, user)
  }

  private async handleCollector (message: Message, guildChannels: GuildChannels, user: GuildMember) {
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 900_000 })

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'move') {
        await user.voice.setChannel(guildChannels.privateVcId)
        await interaction.reply({ content: 'User moved to private VC.', ephemeral: true })
      } else if (interaction.customId === 'remember') {
        await user.voice.setChannel(guildChannels.privateVcId)
        await interaction.reply({ content: 'User moved to private VC and remembered for current session.', ephemeral: true })
        // Todo: remember
      } else if (interaction.customId === 'ignore') {
        // Todo: ignore
      }
      // Disable buttons and stop collector
      await message.edit({ components: [this.makeDisabledButtons()] })
      collector.stop()
    })
  }
}
