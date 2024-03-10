/**
 * Handles all the stores related to voiceStateUpdateListener.ts
 * (Cooldowns, remembered users, and ignored users)
 * Remembered users are moved to the voice channel automatically in that guild
 * Ignored users don't send notifications
 * All states reset upon ending session
 */
import { container } from '@sapphire/framework'

/**
 * Set the cooldown for a user in a specific guild's session.
 *
 * @param {string} userId - The ID of the user
 * @param {string} guildId - The ID of the guild
 */
const setCooldown = (userId: string, guildId: string) => {
  // Check if session is already stored
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return

  const user = session.usersInCooldown.find((u) => u.id === userId)
  if (user == null) {
    session.usersInCooldown.push({ id: userId, timestamp: Date.now() })
  } else {
    user.timestamp = Date.now()
  }
}

/**
 * Clears the cooldown for a specific user in a guild session.
 *
 * @param {string} userId - The ID of the user whose cooldown is being cleared
 * @param {string} guildId - The ID of the guild session
 */
const clearCooldown = (userId: string, guildId: string) => {
  // Check if session is already stored
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return

  const user = session.usersInCooldown.find((u) => u.id === userId)
  if (user == null) return
  session.usersInCooldown = session.usersInCooldown.filter((u) => u.id !== userId)
}

/**
 * Check if the user is in cooldown for the specified guild.
 *
 * @param {string} userId - The ID of the user to check.
 * @param {string} guildId - The ID of the guild to check.
 * @return {boolean} Returns true if the user is in cooldown, otherwise false.
 */
const checkIfUserIsInCooldown = (userId: string, guildId: string): boolean => {
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return false

  if (session.usersInCooldown.length === 0) return false

  const user = session.usersInCooldown.find((u) => u.id === userId)
  if (user == null) return false
  // Check if 15 minutes have passed since user tried to join
  if (Date.now() - user.timestamp > 15 * 60 * 1000) {
    return false
  }
  return true
}

/**
 * Sets the remembered user for a specific guild, if not already stored in the session.
 *
 * @param {string} userId - The ID of the user to be remembered.
 * @param {string} guildId - The ID of the guild for which the user is to be remembered.
 */
const setRememberedUser = (userId: string, guildId: string) => {
  // Check if session is already stored
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return

  const user = session.rememberedUsers.find((u) => u.id === userId)
  if (user == null) {
    session.rememberedUsers.push({ id: userId })
  }
}

/**
 * Check if the user is remembered in the session for the given guild.
 *
 * @param {string} userId - The ID of the user to check.
 * @param {string} guildId - The ID of the guild to check.
 * @return {boolean} Whether the user is remembered in the session for the given guild.
 */
const checkIfUserIsRemembered = (userId: string, guildId: string): boolean => {
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return false

  const rememberedUsers = session.rememberedUsers
  if (rememberedUsers.length === 0) return false

  const user = session.rememberedUsers.find((u) => u.id === userId)
  if (user == null) return false
  return true
}

/**
 * Sets the provided user as an ignored user for the specified guild if not already ignored.
 *
 * @param {string} userId - The ID of the user to be ignored
 * @param {string} guildId - The ID of the guild where the user is to be ignored
 */
const setIgnoredUser = (userId: string, guildId: string) => {
  // Check if session is already stored
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return

  const user = session.ignoredUsers.find((u) => u.id === userId)
  if (user == null) {
    session.ignoredUsers.push({ id: userId })
  }
}

/**
 * Checks if the user is ignored in the specified guild.
 *
 * @param {string} userId - The ID of the user to check.
 * @param {string} guildId - The ID of the guild to check in.
 * @return {boolean} Whether the user is ignored in the guild.
 */
const checkIfUserIsIgnored = (userId: string, guildId: string): boolean => {
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return false

  const ignoredUsers = session.ignoredUsers
  if (ignoredUsers.length === 0) return false

  const user = session.ignoredUsers.find((u) => u.id === userId)
  if (user == null) return false
  return true
}

const voiceStoresManager = {
  setCooldown,
  clearCooldown,
  checkIfUserIsInCooldown,
  setRememberedUser,
  checkIfUserIsRemembered,
  setIgnoredUser,
  checkIfUserIsIgnored
}

export default voiceStoresManager
