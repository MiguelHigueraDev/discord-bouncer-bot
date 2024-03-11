/**
 * This one handles the streamer part of the bot
 * It automatically starts new sessions when someone joins the channel
 * and destroys them when all people leave the channel
 */

import { Listener } from '@sapphire/framework'
import { EmbedBuilder, type VoiceState } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import sessionManager from '../lib/helpers/sessionManager'
import { type GuildChannels } from '../lib/interfaces/GuildChannels'
import { checkChannelPermissions } from '../lib/permissions/checkPermissions'

export class StreamerVoiceUpdateListener extends Listener {
  public constructor (context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate'
    })
  }

  public async run (oldState: VoiceState, newState: VoiceState) {
    const joinedChannel = newState.channelId
    const guildPrivateVc = await guildHandler.getGuildPrivateVc(newState.guild.id)
    if (joinedChannel === guildPrivateVc) {
      // Check if this guild has the bouncer enabled
      if (!await this.checkIfGuildIsValid(newState.guild.id)) return

      if (newState.channel!.members.size === 1) {
        const guildTextChannelId = await guildHandler.getGuildTextChannel(newState.guild.id)
        const waitingVcId = await guildHandler.getGuildWaitingVc(newState.guild.id)

        // Check if the bot has permission to access channels and move members
        if (guildPrivateVc == null || waitingVcId == null || guildTextChannelId == null) return
        if (!await this.checkPermissions({ privateVcId: guildPrivateVc, waitingVcId, textChannelId: guildTextChannelId }, newState)) return

        // Channel hasn't been set, return early
        if (guildTextChannelId == null || waitingVcId == null) return
        const guildTextChannel = await newState.guild.channels.fetch(guildTextChannelId)

        if (guildTextChannel == null) return
        if (guildTextChannel.isTextBased()) {
          // Start session
          const sessionStarted = await sessionManager.startSession(newState.guild.id)
          if (!sessionStarted) return
          const embed = this.makeEmbed(waitingVcId)
          await guildTextChannel.send({ embeds: [embed] })
        }
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

  private async checkPermissions (channels: GuildChannels, state: VoiceState): Promise<boolean> {
    const { privateVcId, waitingVcId, textChannelId } = channels
    const privateVc = await state.client.channels.fetch(privateVcId)
    const waitingVc = await state.client.channels.fetch(waitingVcId)
    const textChannel = await state.client.channels.fetch(textChannelId)
    if (privateVc == null || waitingVc == null || textChannel == null) return false
    if (privateVc.isVoiceBased() && waitingVc.isVoiceBased() && textChannel.isTextBased()) {
      // Check permissions for each
      const checkPrivateVc = await checkChannelPermissions(state.guild.id, privateVcId, ['Connect', 'Speak', 'MoveMembers'])
      const checkWaitingVc = await checkChannelPermissions(state.guild.id, waitingVcId, ['Connect', 'Speak', 'MoveMembers'])
      const checkTextChannel = await checkChannelPermissions(state.guild.id, textChannelId, ['ViewChannel', 'SendMessages'])
      return (checkPrivateVc === true && checkWaitingVc === true && checkTextChannel === true)
    }
    return false
  }

  private readonly makeEmbed = (waitingVcId: string): EmbedBuilder => {
    const embed = new EmbedBuilder()
      .setColor('Blurple')
      .setTitle('New session started')
      .setDescription(`You will be notified of all people who join <#${waitingVcId}> in this channel.`)

    return embed
  }
}
