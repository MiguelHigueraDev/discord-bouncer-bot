/**
 * Handles all the stores related to voiceStateUpdateListener.ts
 * (Cooldowns, remembered users, and ignored users)
 * Remembered users are moved to the voice channel automatically in that guild
 * Ignored users don't send notifications
 * All states reset upon ending session
 */
import { container } from '@sapphire/framework'

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

const clearCooldown = (userId: string, guildId: string) => {
  // Check if session is already stored
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return

  const user = session.usersInCooldown.find((u) => u.id === userId)
  if (user == null) return
  session.usersInCooldown = session.usersInCooldown.filter((u) => u.id !== userId)
}

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

const setRememberedUser = (userId: string, guildId: string) => {
  // Check if session is already stored
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return

  const user = session.rememberedUsers.find((u) => u.id === userId)
  if (user == null) {
    session.rememberedUsers.push({ id: userId })
  }
}

const checkIfUserIsRemembered = (userId: string, guildId: string): boolean => {
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return false

  const rememberedUsers = session.rememberedUsers
  if (rememberedUsers.length === 0) return false

  const user = session.rememberedUsers.find((u) => u.id === userId)
  if (user == null) return false
  return true
}

const setIgnoredUser = (userId: string, guildId: string) => {
  // Check if session is already stored
  const session = container.sessions.find((s) => s.guildId === guildId)
  if (session == null) return

  const user = session.ignoredUsers.find((u) => u.id === userId)
  if (user == null) {
    session.ignoredUsers.push({ id: userId })
  }
}

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
