/**
 * This one destroys sessions when all users leave the private VC
 */

import { Listener } from '@sapphire/framework'
import { EmbedBuilder, type VoiceState } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import sessionManager from '../lib/helpers/sessionManager'

export class SessionEndVoiceStateUpdateListener extends Listener {
  public constructor (context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate'
    })
  }

  public async run (oldState: VoiceState, newState: VoiceState) {
    // Check if session exists in the first place
    if (!sessionManager.checkIfSessionExists(oldState.guild.id)) return

    const leftChannel = oldState.channelId
    const guildPrivateVc = await guildHandler.getGuildPrivateVc(newState.guild.id)
    if (leftChannel === guildPrivateVc) {
      if (oldState.channel!.members.size === 0) {
        // Check channel is valid
        const guildTextChannelId = await guildHandler.getGuildTextChannel(oldState.guild.id)
        if (guildTextChannelId == null) return
        const guildTextChannel = await oldState.guild.channels.fetch(guildTextChannelId)
        if (guildTextChannel == null) return

        // Destroy session
        const embed = this.makeEmbed()
        if (guildTextChannel.isTextBased()) {
          sessionManager.destroySession(oldState.guild.id)
          await guildTextChannel.send({ embeds: [embed] })
        }
      }
    }
  }

  private readonly makeEmbed = (): EmbedBuilder => {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Session ended')
      .setDescription('All people have left the private voice channel. The session has ended.')
    return embed
  }
}
