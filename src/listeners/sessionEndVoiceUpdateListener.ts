/**
 * This one destroys sessions when all users leave the private VC
 */

import { Listener } from '@sapphire/framework'
import { ChannelType, EmbedBuilder, type VoiceState } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import sessionManager from '../lib/helpers/sessionManager'

export class SessionEndVoiceStateUpdateListener extends Listener {
  public constructor (
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate'
    })
  }

  public async run (oldState: VoiceState, newState: VoiceState) {
    if (!sessionManager.checkIfSessionExists(oldState.guild.id)) return

    const leftChannel = oldState.channelId
    const guildPrivateVcId = await guildHandler.getGuildPrivateVcId(
      newState.guild.id
    )
    if (
      leftChannel === guildPrivateVcId &&
      oldState.channel?.members.size === 0
    ) {
      const guildTextChannelId = await guildHandler.getGuildTextChannelId(
        oldState.guild.id
      )
      if (guildTextChannelId == null) return
      const guildTextChannel = await oldState.guild.channels.fetch(
        guildTextChannelId
      )

      if (guildTextChannel?.type === ChannelType.GuildText) {
        sessionManager.destroySession(oldState.guild.id)
        await guildTextChannel?.send({ embeds: [this.makeEmbed()] })
      }
    }
  }

  private readonly makeEmbed = (): EmbedBuilder => {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Session ended')
      .setDescription(
        'All people have left the private voice channel. The session has ended.'
      )
    return embed
  }
}
