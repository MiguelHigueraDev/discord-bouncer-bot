import { container } from '@sapphire/framework'
import guildHandler from './guildHandler'

/**
 * Updates the status of a user.
 * If the user doesn't exist, creates a new record for the user.
 * If the user exists, updates the username.
 *
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<boolean>} A promise that resolves to true if the operation was successful, false otherwise.
 * @throws {Error} Throws an error if an error occurs during the operation.
 */
const updateUserStatus = async (userId: string): Promise<boolean> => {
  try {
    const foundUser = await container.db.user.findFirst({ where: { id: userId } })
    const username = (await container.client.users.fetch(userId)).username

    if (foundUser == null) {
      await container.db.user.create({
        data: {
          id: userId,
          username
        }
      })
    } else {
      await container.db.user.update({
        where: {
          id: userId
        },
        data: {
          username
        }
      })
    }
    return true
  } catch (error) {
    console.error('An error has ocurred while running userHandler:updateUserStatus', error)
    return false
  }
}

/**
 * Updates the status of a guild user.
 * If the user doesn't exist, creates a new record for the user in the guild.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} guildId - The unique identifier of the guild.
 * @returns {Promise<boolean>} A promise that resolves to true if the operation was successful, false otherwise.
 * @throws {Error} Throws an error if an error occurs during the operation.
 */
const updateGuildUserStatus = async (userId: string, guildId: string): Promise<boolean> => {
  try {
    // First update user status
    const updatedUser = await updateUserStatus(userId)
    if (!updatedUser) {
      return false
    }

    // Update guild status as well
    const updatedGuild = await guildHandler.updateGuildStatus(guildId)
    if (!updatedGuild) {
      return false
    }

    const foundGuildUser = await container.db.guildUser.findFirst({ where: { userId, guildId } })
    if (foundGuildUser == null) {
      await container.db.guildUser.create({
        data: {
          userId,
          guildId,
          allowlisted: false,
          blocklisted: false
        }
      })
    }
    return true
  } catch (error) {
    console.error('An error has ocurred while running userHandler:updateGuildUserStatus', error)
    return false
  }
}

/**
 * Toggles the blocklist status of a user within a specific guild.
 * If the user exists, updates the blocklist status. If not, creates a new record.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} guildId - The unique identifier of the guild.
 * @param {boolean} [blocklisted=true] - The desired blocklist status of the user. Default is true.
 * @returns {Promise<boolean>} A promise that resolves to true if the operation was successful, false otherwise.
 * @throws {Error} Throws an error if an error occurs during the operation.
 *
 */
const toggleBlocklistStatus = async (userId: string, guildId: string, blocklisted: boolean = true): Promise<boolean> => {
  try {
    const foundGuildUser = await container.db.guildUser.findUnique({ where: { userId_guildId: { userId, guildId } } })
    if (foundGuildUser == null) {
      // GuildUser doesn't exist, create it.
      const created = await updateGuildUserStatus(userId, guildId)
      if (!created) return false
    }

    await container.db.guildUser.update({
      where: {
        userId_guildId: {
          userId,
          guildId
        }
      },
      data: {
        blocklisted
      }
    })
    return true
  } catch (error) {
    console.error('An error has ocurred while running userHandler:addUserToBlocklist', error)
    return false
  }
}

/**
 * Toggles the allowlist status of a user within a specific guild.
 * If the user exists, updates the allowlist status. If not, creates a new record.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} guildId - The unique identifier of the guild.
 * @param {boolean} [allowlisted=true] - The desired allowlist status of the user. Default is true.
 * @returns {Promise<boolean>} A promise that resolves to true if the operation was successful, false otherwise.
 * @throws {Error} Throws an error if an error occurs during the operation.
 *
 */
const toggleAllowlistStatus = async (userId: string, guildId: string, allowlisted: boolean = true): Promise<boolean> => {
  try {
    const foundGuildUser = await container.db.guildUser.findFirst({ where: { userId, guildId } })
    if (foundGuildUser == null) {
      // GuildUser doesn't exist, create it.
      const created = await updateGuildUserStatus(userId, guildId)
      if (!created) return false
    }

    await container.db.guildUser.update({
      where: {
        userId_guildId: {
          userId,
          guildId
        }
      },
      data: {
        allowlisted
      }
    })
    return true
  } catch (error) {
    console.error('An error has ocurred while running userHandler:addUserToAllowlist', error)
    return false
  }
}

const userHandler = {
  updateUserStatus, updateGuildUserStatus, toggleBlocklistStatus, toggleAllowlistStatus
}

export default userHandler
