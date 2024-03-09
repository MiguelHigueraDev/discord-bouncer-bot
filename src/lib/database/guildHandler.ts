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
          name: guildName
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

const guildHandler = {
  updateGuildStatus
}

export default guildHandler
