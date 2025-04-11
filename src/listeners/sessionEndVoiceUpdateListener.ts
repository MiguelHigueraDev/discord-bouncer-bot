/**
 * Destroys active sessions when all users leave the private voice channel
 */

import { Listener } from '@sapphire/framework'
import { ChannelType, EmbedBuilder, type VoiceState } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import sessionManager from '../lib/helpers/sessionManager'

export class SessionEndVoiceStateUpdateListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate',
      name: 'sessionEndVoiceUpdate'
    })
  }

  public async run(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (!oldState.channelId) return                                        // No channel was left
    if (!sessionManager.checkIfSessionExists(oldState.guild.id)) return    // No active session

    try {
      const guildId = oldState.guild.id
      const guildPrivateVcId = await guildHandler.getGuildPrivateVcId(guildId)
      
      if (oldState.channelId !== guildPrivateVcId || oldState.channel?.members.size !== 0) return
      
      await this.handleEmptyPrivateChannel(guildId, oldState)
    } catch (error) {
      this.container.logger.error(`Session end error: ${error}`)
    }
  }

  /**
   * Handles cleanup when the private voice channel becomes empty
   */
  private async handleEmptyPrivateChannel(guildId: string, state: VoiceState): Promise<void> {
    const guildTextChannelId = await guildHandler.getGuildTextChannelId(guildId)
    if (!guildTextChannelId) return
      
    const textChannel = await state.guild.channels.fetch(guildTextChannelId)
    if (!textChannel?.isTextBased()) return
      
    sessionManager.destroySession(guildId)
    await textChannel.send({ embeds: [this.createSessionEndEmbed()] })
  }

  /**
   * Creates the session end notification embed
   */
  private createSessionEndEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setColor('Red')
      .setTitle('Session Ended')
      .setDescription('All members have left the private voice channel. The session has ended.')
      .setTimestamp()
  }
}
