/**
 * Handles the creation and deletion of sessions
 * Sessions end when someone joins the private channel
 * and end when everybody leaves it
 */
import { container } from '@sapphire/framework'
import guildHandler from '../database/guildHandler'
import { type Session } from '../interfaces/Session'

/**
 * Start a new session for the specified guild.
 *
 * @param {string} guildId - The ID of the guild for which to start the session
 * @return {Promise<boolean>} A boolean indicating whether the session was successfully started
 */
const startSession = async (guildId: string): Promise<boolean> => {
  // Check if guild is already stored
  const guild = container.sessions.find((g) => g.guildId === guildId)
  if (guild == null) {
    // Fetch channels to store them in session
    const guildWaitingVc = await guildHandler.getGuildWaitingVc(guildId)
    const guildPrivateVc = await guildHandler.getGuildPrivateVc(guildId)
    const guildTextChannel = await guildHandler.getGuildTextChannel(guildId)

    if (guildWaitingVc == null || guildPrivateVc == null || guildTextChannel == null) return false
    const channels = {
      privateVcId: guildPrivateVc,
      waitingVcId: guildWaitingVc,
      textChannelId: guildTextChannel
    }
    // Guild doesn't have an active session, create it
    container.sessions.push({ guildId, ignoredUsers: [], rememberedUsers: [], usersInCooldown: [], channels })
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
