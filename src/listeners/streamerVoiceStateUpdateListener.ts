/**
 * Manages streamer sessions by automatically starting when someone joins a private channel
 * and destroying them when all people leave the channel
 */

import { Listener } from '@sapphire/framework'
import { EmbedBuilder, PermissionResolvable, type VoiceState } from 'discord.js'
import guildHandler from '../lib/database/guildHandler'
import sessionManager from '../lib/helpers/sessionManager'
import { type GuildChannels } from '../lib/interfaces/GuildChannels'
import { checkChannelPermissions } from '../lib/permissions/checkPermissions'

interface RequiredPermissions {
  voice: PermissionResolvable[]
  text: PermissionResolvable[]
}

const REQUIRED_PERMISSIONS: RequiredPermissions = {
  voice: ['Connect', 'Speak', 'MoveMembers'],
  text: ['ViewChannel', 'SendMessages']
}

export class StreamerVoiceUpdateListener extends Listener {
  public constructor (context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate'
    })
  }

  public async run (oldState: VoiceState, newState: VoiceState) {
    const privateVcId = await guildHandler.getGuildPrivateVcId(newState.guild.id)
    if (newState.channelId !== privateVcId) return

    // Skip if guild configuration is invalid
    if (!await this.isGuildConfigValid(newState.guild.id)) return

    if (!newState.channel?.members.size) return

    const channels = await this.getGuildChannels(newState.guild.id)
    if (!channels) return

    if (!await this.hasRequiredPermissions(channels, newState)) return

    const textChannel = await newState.guild.channels.fetch(channels.textChannelId)
    if (!textChannel?.isTextBased()) return

    await this.startAndNotify(newState.guild.id, textChannel, channels.waitingVcId)
  }

  /**
   * Starts a session and sends notification
   */
  private async startAndNotify (guildId: string, textChannel: any, waitingVcId: string): Promise<void> {
    const sessionStarted = await sessionManager.startSession(guildId)
    if (!sessionStarted) return

    const embed = this.createSessionEmbed(waitingVcId)
    await textChannel.send({ embeds: [embed] })
  }

  /**
   * Retrieves all channel IDs for a guild
   */
  private async getGuildChannels (guildId: string): Promise<GuildChannels | null> {
    const privateVcId = await guildHandler.getGuildPrivateVcId(guildId)
    const waitingVcId = await guildHandler.getGuildWaitingVcId(guildId)
    const textChannelId = await guildHandler.getGuildTextChannelId(guildId)

    if (!privateVcId || !waitingVcId || !textChannelId) return null

    return { privateVcId, waitingVcId, textChannelId }
  }

  /**
   * Check if guild has bouncer enabled and properly configured
   */
  private async isGuildConfigValid (guildId: string): Promise<boolean> {
    return await guildHandler.getGuildBouncerStatus(guildId)
  }

  /**
   * Verifies the bot has all required permissions in the configured channels
   */
  private async hasRequiredPermissions (channels: GuildChannels, state: VoiceState): Promise<boolean> {
    const { privateVcId, waitingVcId, textChannelId } = channels;

    const [privateVc, waitingVc, textChannel] = await Promise.all([
      state.client.channels.fetch(privateVcId),
      state.client.channels.fetch(waitingVcId),
      state.client.channels.fetch(textChannelId),
    ]);

    if (!privateVc || !waitingVc || !textChannel) return false;

    if (
      !privateVc.isVoiceBased() ||
      !waitingVc.isVoiceBased() ||
      !textChannel.isTextBased()
    ) {
      return false;
    }

    const results = await Promise.all([
      checkChannelPermissions(
        state.guild.id,
        privateVcId,
        REQUIRED_PERMISSIONS.voice
      ),
      checkChannelPermissions(
        state.guild.id,
        waitingVcId,
        REQUIRED_PERMISSIONS.voice
      ),
      checkChannelPermissions(
        state.guild.id,
        textChannelId,
        REQUIRED_PERMISSIONS.text
      ),
    ]);

    // Check if all permissions results are boolean true
    // If any result is a string, it's an error message
    return results.every((result) => result === true);
  }

  /**
   * Creates the session notification embed
   */
  private createSessionEmbed (waitingVcId: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor('Blurple')
      .setTitle('New session started')
      .setDescription(`You will be notified of all people who join <#${waitingVcId}> in this channel.`)
  }
}
