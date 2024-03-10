/**
 * Handles all the stores related to voiceStateUpdateListener.ts
 * (Cooldowns, remembered users, and ignored users)
 * Remembered users are moved to the voice channel automatically in that guild
 * Ignored users don't send notifications
 * All states reset upon ending session
 */
import { container } from '@sapphire/framework'

/**
 * Sets a cooldown for a user in a guild.
 *
 * @param {string} userId - the ID of the user
 * @param {string} guildId - the ID of the guild
 */
const setCooldown = (userId: string, guildId: string) => {
  // Check if guild is already stored
  let guild = container.usersInCooldown.find((g) => g.id === guildId)
  if (guild == null) {
    // If not, push it and store the user after
    container.usersInCooldown.push({ id: guildId, users: [] })
    guild = container.usersInCooldown.find((g) => g.id === guildId)
  }

  // Check if user exists in guild
  const user = guild?.users.find((u) => u.id === userId)
  if (user == null) {
    guild?.users.push({ id: userId, timestamp: Date.now() })
  } else {
    user.timestamp = Date.now()
  }
}

/**
   * Check if the user is in cooldown for a specific guild.
   *
   * @param {string} userId - The ID of the user
   * @param {string} guildId - The ID of the guild
   * @return {boolean} Whether the user is in cooldown
   */
const checkIfUserIsInCooldown = (userId: string, guildId: string): boolean => {
  const currentGuild = container.usersInCooldown.find((g) => g.id === guildId)
  if (currentGuild == null) return false

  if (currentGuild.users.length === 0) return false
  const user = currentGuild.users.find((u) => u.id === userId)

  if (user == null) return false
  // Check if 15 minutes have passed since user tried to join
  if (Date.now() - user.timestamp > 15 * 60 * 1000) {
    return false
  }
  return true
}

/**
 * Set remembered user for a given guild and user.
 *
 * @param {string} userId - The ID of the user
 * @param {string} guildId - The ID of the guild
 */
const setRememberedUser = (userId: string, guildId: string) => {
  // Check if guild is already stored
  let guild = container.rememberedUsers.find((g) => g.id === guildId)
  if (guild == null) {
    // If not, push it and store the user after
    container.rememberedUsers.push({ id: guildId, users: [] })
    guild = container.rememberedUsers.find((g) => g.id === guildId)
  }

  const user = guild?.users.find((u) => u.id === userId)
  if (user == null) {
    guild?.users.push({ id: userId })
  }
}

/**
 * Checks if the user is remembered in the given guild.
 *
 * @param {string} userId - The ID of the user to check.
 * @param {string} guildId - The ID of the guild to check.
 * @return {boolean} Whether the user is remembered in the guild or not.
 */
const checkIfUserIsRemembered = (userId: string, guildId: string): boolean => {
  const currentGuild = container.rememberedUsers.find((g) => g.id === guildId)
  if (currentGuild == null) return false

  if (currentGuild.users.length === 0) return false
  const user = currentGuild.users.find((u) => u.id === userId)

  if (user == null) return false
  return true
}

/**
 * Sets the ignored user for a specific guild if not already ignored.
 *
 * @param {string} userId - The ID of the user to ignore.
 * @param {string} guildId - The ID of the guild to set the ignored user for.
 */
const setIgnoredUser = (userId: string, guildId: string) => {
  // Check if guild is already stored
  let guild = container.ignoredUsers.find((g) => g.id === guildId)
  if (guild == null) {
    // If not, push it and store the user after
    container.ignoredUsers.push({ id: guildId, users: [] })
    guild = container.ignoredUsers.find((g) => g.id === guildId)
  }

  const user = guild?.users.find((u) => u.id === userId)
  if (user == null) {
    guild?.users.push({ id: userId })
  }
}

/**
 * Checks if a user is ignored in a specific guild.
 *
 * @param {string} userId - The ID of the user to check.
 * @param {string} guildId - The ID of the guild to check.
 * @return {boolean} Returns true if the user is ignored in the specified guild, otherwise false.
 */
const checkIfUserIsIgnored = (userId: string, guildId: string): boolean => {
  const currentGuild = container.ignoredUsers.find((g) => g.id === guildId)
  if (currentGuild == null) return false

  if (currentGuild.users.length === 0) return false
  const user = currentGuild.users.find((u) => u.id === userId)

  if (user == null) return false
  return true
}

const voiceStoresManager = {
  setCooldown,
  checkIfUserIsInCooldown,
  setRememberedUser,
  checkIfUserIsRemembered,
  setIgnoredUser,
  checkIfUserIsIgnored
}

export default voiceStoresManager
