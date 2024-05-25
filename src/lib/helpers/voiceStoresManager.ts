/**
 * Handles all the stores related to voiceStateUpdateListener.ts
 * (Cooldowns, remembered users, and ignored users)
 * Remembered users are moved to the voice channel automatically in that guild
 * Ignored users don't send notifications
 * All states reset upon ending session
 */
import { container } from '@sapphire/framework'

/**
 * Sets a cooldown for a user in a specific guild and private voice channel.
 * @param userId - The ID of the user.
 * @param guildId - The ID of the guild.
 * @param privateVcId - The ID of the private voice channel.
 */
const setCooldown = (userId: string, guildId: string, privateVcId: string) => {
  // Check if guild exists
  const session = getGuildSession(privateVcId, guildId)
  if (session == null) return

  const user = session.usersInCooldown.find((u) => u.id === userId)
  if (user == null) {
    session.usersInCooldown.push({ id: userId, timestamp: Date.now() })
  } else {
    user.timestamp = Date.now()
  }
}

/**
 * Clears the cooldown for a specific user in a guild's session.
 * @param {string} userId - The ID of the user.
 * @param {string} guildId - The ID of the guild.
 * @param {string} privateVcId - The ID of the private voice channel.
 */
const clearCooldown = (userId: string, guildId: string, privateVcId: string) => {
  const session = getGuildSession(privateVcId, guildId)
  if (session == null) return

  const user = session.usersInCooldown.find((u) => u.id === userId)
  if (user == null) return
  session.usersInCooldown = session.usersInCooldown.filter((u) => u.id !== userId)
}

/**
 * Checks if a user is in cooldown for joining a private voice channel.
 * @param userId - The ID of the user.
 * @param guildId - The ID of the guild.
 * @param privateVcId - The ID of the private voice channel.
 * @returns A boolean indicating whether the user is in cooldown.
 */
const checkIfUserIsInCooldown = (userId: string, guildId: string, privateVcId: string): boolean => {
  const session = getGuildSession(privateVcId, guildId)
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
 * Sets a user as remembered in a session.
 * @param userId - The ID of the user to be remembered.
 * @param guildId - The ID of the guild where the session belongs.
 * @param privateVcId - The ID of the private voice channel associated with the session.
 */
const setRememberedUser = (userId: string, guildId: string, privateVcId: string) => {
  const session = getGuildSession(privateVcId, guildId)
  if (session == null) return

  const user = session.rememberedUsers.find((u) => u.id === userId)
  if (user == null) {
    session.rememberedUsers.push({ id: userId })
  }
}

/**
 * Checks if a user is remembered in a specific guild's session for a private voice channel.
 * @param userId - The ID of the user to check.
 * @param guildId - The ID of the guild.
 * @param privateVcId - The ID of the private voice channel.
 * @returns A boolean indicating whether the user is remembered or not.
 */
const checkIfUserIsRemembered = (userId: string, guildId: string, privateVcId: string): boolean => {
  const session = getGuildSession(privateVcId, guildId)
  if (session == null) return false

  const rememberedUsers = session.rememberedUsers
  if (rememberedUsers.length === 0) return false

  const user = session.rememberedUsers.find((u) => u.id === userId)
  if (user == null) return false
  return true
}

/**
 * Sets an ignored user for a specific guild and private voice channel.
 * If the guild or session does not exist, the function returns early.
 * If the user is not already ignored, it will be added to the ignored users list.
 *
 * @param userId - The ID of the user to be ignored.
 * @param guildId - The ID of the guild.
 * @param privateVcId - The ID of the private voice channel.
 */
const setIgnoredUser = (userId: string, guildId: string, privateVcId: string) => {
  const session = getGuildSession(privateVcId, guildId)
  if (session == null) return

  const user = session.ignoredUsers.find((u) => u.id === userId)
  if (user == null) {
    session.ignoredUsers.push({ id: userId })
  }
}

/**
 * Checks if a user is ignored in a specific private voice channel session.
 * @param userId - The ID of the user to check.
 * @param guildId - The ID of the guild where the private voice channel session belongs.
 * @param privateVcId - The ID of the private voice channel session to check.
 * @returns A boolean indicating whether the user is ignored or not.
 */
const checkIfUserIsIgnored = (userId: string, guildId: string, privateVcId: string): boolean => {
  const session = getGuildSession(privateVcId, guildId)
  if (session == null) return false

  const ignoredUsers = session.ignoredUsers
  if (ignoredUsers.length === 0) return false

  const user = session.ignoredUsers.find((u) => u.id === userId)
  if (user == null) return false
  return true
}

/**
 * Retrieves the session associated with a private voice channel in a guild.
 * @param privateVcId The ID of the private voice channel.
 * @param guildId The ID of the guild.
 * @returns The session associated with the private voice channel, or undefined if not found.
 */
const getGuildSession = (privateVcId: string, guildId: string) => {
  const guild = container.guilds.find((g) => g.id === guildId)
  if (guild == null) return
  return guild.sessions.find((s) => s.privateVcId === privateVcId)
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
