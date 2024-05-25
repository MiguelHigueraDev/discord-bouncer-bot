/**
 * Handles guilds and their sessions
 * One session per private channel
 * Sessions start when someone joins the private channel
 * and end when everybody leaves it
 */

import { container } from '@sapphire/framework'
import guildHandler from '../database/guildHandler'

/**
 * Starts a session for a guild with the specified private voice channel ID.
 * If the guild does not exist, it creates a new guild and stores the session.
 * If the guild already exists, it only stores the session.
 * @param {string} guildId - The ID of the guild.
 * @param {string} privateVcId - The ID of the private voice channel.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the session was started successfully, or `false` otherwise.
 */
const startSession = async (guildId: string, privateVcId: string): Promise<boolean> => {
  const guild = container.guilds.find((g) => g.id === guildId)
  if (guild == null) {
    // Store guild and then store session
    // Fetch channels from database
    const waitingVcId = await guildHandler.getGuildWaitingVcId(guildId)
    const textChannelId = await guildHandler.getGuildTextChannelId(guildId)
    if (waitingVcId == null || textChannelId == null) return false
    container.guilds.push({
      id: guildId,
      sessions: [{
        privateVcId,
        ignoredUsers: [],
        rememberedUsers: [],
        usersInCooldown: []
      }],
      waitingVcId,
      textChannelId
    })
    return true
  } else {
    // Only store session
    const session = guild.sessions.find((s) => s.privateVcId === privateVcId)
    if (session == null) {
      guild.sessions.push({
        privateVcId,
        ignoredUsers: [],
        rememberedUsers: [],
        usersInCooldown: []
      })
      return true
    }
  }
  return false
}

/**
 * Retrieves the session associated with the given guild ID and private VC ID.
 * @param {string} guildId - The ID of the guild.
 * @param {string} privateVcId - The ID of the private voice channel.
 * @returns {Session | undefined} The session object if found, otherwise undefined.
 */
const getSession = (guildId: string, privateVcId: string) => {
  const guild = container.guilds.find((g) => g.id === guildId)
  if (guild == null) return
  return guild.sessions.find((s) => s.privateVcId === privateVcId)
}

/**
 * Removes a session from the guild's sessions array based on the private voice channel ID.
 * @param {string} guildId - The ID of the guild.
 * @param {string} privateVcId - The ID of the private voice channel.
 */
const destroySession = (guildId: string, privateVcId: string) => {
  const guild = container.guilds.find((g) => g.id === guildId)
  if (guild == null) return
  guild.sessions = guild.sessions.filter((s) => s.privateVcId !== privateVcId)
}

/**
 * Checks if a session exists for a given guild and private voice channel ID.
 * @param {string} guildId - The ID of the guild.
 * @param {string} privateVcId - The ID of the private voice channel.
 * @returns {boolean} - Returns true if a session exists, false otherwise.
 */
const checkIfSessionExists = (guildId: string, privateVcId: string) => {
  const guild = container.guilds.find((g) => g.id === guildId)
  if (guild == null) return false
  return guild.sessions.find((s) => s.privateVcId === privateVcId) != null
}

const guildManager = {
  startSession, getSession, destroySession, checkIfSessionExists
}

export default guildManager
