/**
 * Handles the creation and deletion of sessions
 * Sessions end when someone joins the private channel
 * and end when everybody leaves it
 */
import { container } from '@sapphire/framework'

/**
 * Starts a new session for the given guild if it doesn't already exist.
 *
 * @param {string} guildId - The ID of the guild for which to start a session
 */
const startSession = (guildId: string) => {
  // Check if guild is already stored
  const guild = container.sessions.find((g) => g.guildId === guildId)
  if (guild == null) {
    // Guild does not exist, create new session
    container.sessions.push({ guildId, ignoredUsers: [], rememberedUsers: [], usersInCooldown: [] })
  }
}

/**
 * Destroys the session for the given guild ID.
 *
 * @param {string} guildId - The ID of the guild for which the session needs to be destroyed.
 * @return {void}
 */
const destroySession = (guildId: string) => {
  container.sessions = container.sessions.filter((g) => g.guildId !== guildId)
}

/**
 * Checks if a session exists for the given guild ID.
 *
 * @param {string} guildId - The ID of the guild to check for session existence.
 * @return {boolean} true if session exists, false otherwise
 */
const checkIfSessionExists = (guildId: string) => {
  const guild = container.sessions.find((g) => g.guildId === guildId)
  if (guild == null) return false
  return true
}

const sessionManager = {
  startSession, destroySession, checkIfSessionExists
}

export default sessionManager
