import { container } from '@sapphire/framework'

/**
 * Updates the status of a guild.
 * If the guild doesn't exist, creates a new record for the guild.
 * If the guild exists, updates the guild name.
 *
 * @param {string} guildId - The unique identifier of the guild.
 * @returns {Promise<boolean>} A promise that resolves to true if the operation was successful, false otherwise.
 * @throws {Error} Throws an error if an error occurs during the operation.
 */
const updateGuildStatus = async (guildId: string): Promise<boolean> => {
  try {
    const foundGuild = await container.db.guild.findFirst({ where: { id: guildId } })
    const guildName = (await container.client.guilds.fetch(guildId)).name

    if (foundGuild == null) {
      await container.db.guild.create({
        data: {
          id: guildId,
          name: guildName,
          enabled: false
        }
      })
    } else {
      // Only update name
      await container.db.guild.update({
        where: {
          id: guildId
        },
        data: {
          name: guildName
        }
      })
    }

    return true
  } catch (error) {
    console.error('An error has ocurred while running guildHandler:updateGuildStatus', error)
    return false
  }
}

/**
 * Toggles the bouncer for a specific guild.
 *
 * @param {string} guildId - The ID of the guild to toggle the bouncer for
 * @param {boolean} enabled - The new status of the bouncer (true for enabled, false for disabled)
 * @return {Promise<boolean>} Whether the bouncer was successfully toggled
 */
const toggleGuildBouncer = async (guildId: string, enabled: boolean): Promise<boolean> => {
  try {
    const updatedGuild = await updateGuildStatus(guildId)
    if (!updatedGuild) {
      return false
    }

    await container.db.guild.update({
      where: {
        id: guildId
      },
      data: {
        enabled
      }
    })
    return true
  } catch (error) {
    console.error('An error has ocurred while running guildHandler:toggleGuildBouncer', error)
    return false
  }
}

/**
 * Retrieves the bouncer status of the specified guild.
 *
 * @param {string} guildId - The ID of the guild
 * @return {Promise<boolean>} A boolean representing the bouncer status of the guild
 */
const getGuildBouncerStatus = async (guildId: string): Promise<boolean> => {
  const guild = await container.db.guild.findUnique({ where: { id: guildId } })
  return guild?.enabled ?? false
}

/**
 * Updates the private voice channel for a specific guild.
 *
 * @param {string} guildId - The ID of the guild
 * @param {string} privateVcId - The ID of the private voice channel
 * @return {Promise<boolean>} A boolean indicating whether the update was successful
 */
const updateGuildPrivateVc = async (guildId: string, privateVcId: string): Promise<boolean> => {
  try {
    const updatedGuild = await updateGuildStatus(guildId)
    if (!updatedGuild) {
      return false
    }

    await container.db.guild.update({
      where: {
        id: guildId
      },
      data: {
        privateVcId
      }
    })
    return true
  } catch (error) {
    console.error('An error has ocurred while running guildHandler:updateGuildPrivateVc', error)
    return false
  }
}

/**
 * Updates the waiting voice channel for a guild and returns a boolean indicating success.
 *
 * @param {string} guildId - The ID of the guild
 * @param {string} waitingVcId - The ID of the waiting voice channel
 * @return {Promise<boolean>} A boolean indicating whether the update was successful
 */
const updateGuildWaitingVc = async (guildId: string, waitingVcId: string): Promise<boolean> => {
  try {
    const updatedGuild = await updateGuildStatus(guildId)
    if (!updatedGuild) {
      return false
    }

    await container.db.guild.update({
      where: {
        id: guildId
      },
      data: {
        waitingVcId
      }
    })
    return true
  } catch (error) {
    console.error('An error has ocurred while running guildHandler:updateGuildWaitingVc', error)
    return false
  }
}

/**
 * Updates the text channel for a specific guild.
 *
 * @param {string} guildId - The ID of the guild
 * @param {string} textChannelId - The ID of the text channel
 * @return {Promise<boolean>} Whether the text channel was successfully updated
 */
const updateGuildTextChannel = async (guildId: string, textChannelId: string): Promise<boolean> => {
  try {
    const updatedGuild = await updateGuildStatus(guildId)
    if (!updatedGuild) {
      return false
    }

    await container.db.guild.update({
      where: {
        id: guildId
      },
      data: {
        textChannelId
      }
    })
    return true
  } catch (error) {
    console.error('An error has ocurred while running guildHandler:updateGuildTextChannel', error)
    return false
  }
}

/**
 * Returns the private voice channel for a guild.
 *
 * @param {string} guildId - The ID of the guild
 * @return {Promise<string | null>} The ID of the private voice channel or null if not found
 */
const getGuildPrivateVc = async (guildId: string): Promise<string | null> => {
  const guild = await container.db.guild.findUnique({ where: { id: guildId } })
  return guild?.privateVcId ?? null
}

/**
 * Returns the waiting room voice channel for a guild.
 *
 * @param {string} guildId - The ID of the guild
 * @return {Promise<string | null>} The ID of the waiting room voice channel or null if not found
 */
const getGuildWaitingVc = async (guildId: string): Promise<string | null> => {
  const guild = await container.db.guild.findUnique({ where: { id: guildId } })
  return guild?.waitingVcId ?? null
}

/**
 * Returns the text channel for a guild.
 *
 * @param {string} guildId - The ID of the guild
 * @return {Promise<string | null>} The ID of the text channel or null if not found
 */
const getGuildTextChannel = async (guildId: string): Promise<string | null> => {
  const guild = await container.db.guild.findUnique({ where: { id: guildId } })
  return guild?.textChannelId ?? null
}

const guildHandler = {
  updateGuildStatus,
  toggleGuildBouncer,
  getGuildBouncerStatus,
  updateGuildPrivateVc,
  updateGuildWaitingVc,
  updateGuildTextChannel,
  getGuildPrivateVc,
  getGuildWaitingVc,
  getGuildTextChannel
}

export default guildHandler
