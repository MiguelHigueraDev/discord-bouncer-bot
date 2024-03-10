/**
 * This one handles the streamer part of the bot
 * It automatically starts new sessions when someone joins the channel
 * and destroys them when all people leave the channel
 */

import { Listener } from '@sapphire/framework'
import { EmbedBuilder, type VoiceState } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'

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
      // Check if member count is 1 so it only triggers on first member join
      if (newState.channel!.members.size === 1) {
        // Start new session
        const guildTextChannelId = await guildHandler.getGuildTextChannel(newState.guild.id)
        const waitingVcId = await guildHandler.getGuildWaitingVc(newState.guild.id)

        // Channel hasn't been set, return early
        if (guildTextChannelId == null || waitingVcId == null) return
        const guildTextChannel = await newState.guild.channels.fetch(guildTextChannelId)

        if (guildTextChannel == null) return
        if (guildTextChannel.isTextBased()) {
          // Create session
          const embed = this.makeEmbed(waitingVcId)
          await guildTextChannel.send({ embeds: [embed] })
        }
      }
    }
  }

  private readonly makeEmbed = (waitingVcId: string): EmbedBuilder => {
    const embed = new EmbedBuilder()
      .setColor('Blurple')
      .setTitle('New session started')
      .setDescription(`You will be notified of all people who join <#${waitingVcId}> in this channel.`)

    return embed
  }
}
