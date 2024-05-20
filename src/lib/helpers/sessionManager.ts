/**
 * Handles the creation and deletion of sessions
 * Sessions end when someone joins the private channel
 * and end when everybody leaves it
 */
import { container } from '@sapphire/framework'
import guildHandler from '../database/guildHandler'
import { type Session } from '../interfaces/Session'

/**
 * Start a new session for the specified guild and channel.
 *
 * @param {string} guildId - The ID of the guild for which to start the session
 * @param {string} channelId - The ID of the channel to start the session in
 * @return {Promise<boolean>} A boolean indicating whether the session was successfully started
 */
const startSession = async (guildId: string, channelId: string): Promise<boolean> => {
  // Check if guild is already stored
  const guild = container.sessions.find((g) => g.guildId === guildId && g.channelId === channelId)
  if (guild == null) {
    // Fetch channels to store them in session
    const guildWaitingVcId = await guildHandler.getGuildWaitingVcId(guildId)
    const guildPrivateVcId = await guildHandler.getGuildPrivateVcId(guildId)
    const guildTextChannelId = await guildHandler.getGuildTextChannelId(guildId)

    // Check that all IDs are set
    if (guildWaitingVcId == null || guildPrivateVcId == null || guildTextChannelId == null) return false
    const channels = {
      privateVcId: guildPrivateVcId,
      waitingVcId: guildWaitingVcId,
      textChannelId: guildTextChannelId
    }
    // Start session
    container.sessions.push({ guildId, channelId, ignoredUsers: [], rememberedUsers: [], usersInCooldown: [], channels })
    return true
  }
  return false
}

/**
 * Retrieves a session for the given guild ID.
 *
 * @param {string} guildId - The ID of the guild
 * @return {Session | undefined} The session for the given guild ID, or undefined if not found
 */
const getSession = (guildId: string): Session | undefined => {
  return container.sessions.find((g) => g.guildId === guildId)
}

/**
 * Destroys the session for the given guild ID.
 *
 * @param {string} guildId - The ID of the guild for which the session needs to be destroyed.
 * @return {void}
 */
const destroySession = (guildId: string): void => {
  container.sessions = container.sessions.filter((g) => g.guildId !== guildId)
}

/**
 * Checks if a session exists for the given guild ID.
 *
 * @param {string} guildId - The ID of the guild to check for session existence.
 * @return {boolean} true if session exists, false otherwise
 */
const checkIfSessionExists = (guildId: string): boolean => {
  const guild = container.sessions.find((g) => g.guildId === guildId)
  return (guild != null)
}

const sessionManager = {
  startSession, getSession, destroySession, checkIfSessionExists
}

export default sessionManager
