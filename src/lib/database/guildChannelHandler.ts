import { container } from '@sapphire/framework'
/**
 * Adds a private voice channel to the guild's private channel list.
 *
 * @param {string} guildId - The ID of the guild.
 * @param {string} privateVcId - The ID of the private voice channel.
 * @returns {Promise<boolean>} - A promise that resolves to true if the private voice channel was added successfully, or false if an error occurred.
 */
const addPrivateVc = async (guildId: string, privateVcId: string): Promise<boolean> => {
  try {
    await container.db.guildPrivateChannel.create({
      data: {
        guildId,
        privateVcId
      }
    })
    return true
  } catch (error) {
    console.error('An error has ocurred while running guildChannelHandler:addPrivateVc', error)
    return false
  }
}

/**
 * Removes a private voice channel from the database.
 *
 * @param {string} guildId - The ID of the guild.
 * @param {string} privateVcId - The ID of the private voice channel.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the private voice channel was successfully removed, or `false` if an error occurred.
 */
const removePrivateVc = async (guildId: string, privateVcId: string) => {
  try {
    await container.db.guildPrivateChannel.deleteMany({
      where: {
        guildId,
        privateVcId
      }
    })
    return true
  } catch (error) {
    console.error('An error has ocurred while running guildChannelHandler:removePrivateVc', error)
    return false
  }
}

/**
 * Removes all private voice channels associated with a guild.
 * @param {string} guildId - The ID of the guild.
 * @returns {Promise<boolean>} - A promise that resolves to true if the private voice channels are successfully removed, or false if an error occurs.
 */
const removeAllPrivateVcs = async (guildId: string) => {
  try {
    await container.db.guildPrivateChannel.deleteMany({
      where: {
        guildId
      }
    })
    return true
  } catch (error) {
    console.error('An error has ocurred while running guildChannelHandler:removeAllPrivateVcs', error)
    return false
  }
}

const guildChannelHandler = {
  addPrivateVc,
  removePrivateVc,
  removeAllPrivateVcs
}

export default guildChannelHandler
