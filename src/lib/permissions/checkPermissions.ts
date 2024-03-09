import { container } from '@sapphire/framework'
import { type PermissionResolvable } from 'discord.js'

/**
 * Check channel permissions for a user in a guild.
 *
 * @param {string} guildId - The ID of the guild
 * @param {string} userId - The ID of the user
 * @param {string} channelId - The ID of the channel
 * @param {string[]} permissions - The permissions to check
 * @return {Promise<string[] | boolean>} The missing permissions or a boolean indicating if all permissions are present
 */
export const checkChannelPermissions = async (guildId: string, userId: string, channelId: string, permissions: string[]): Promise<string[] | boolean> => {
  try {
    // Fetch guild, guild member, and channel
    const guild = await container.client.guilds.fetch(guildId)
    const guildMember = await guild.members.fetch(userId)
    const channel = await guild.channels.fetch(channelId)

    if (channel == null) {
      return false
    }

    // Store all missing permissions to display them to the user in case they are missing one of them
    const missingPermissions: string[] = []
    for (const permission of permissions) {
      const hasPermission = channel.permissionsFor(guildMember, true).has(permission as PermissionResolvable)
      if (!hasPermission) {
        missingPermissions.push(permission)
      }
    }

    // Return true if user has all perms
    if (missingPermissions.length === 0) {
      return true
    }

    return missingPermissions
  } catch (error) {
    console.error('Error checking permissions', error)
    return false
  }
}
