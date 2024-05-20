import { type Snowflake } from 'discord.js'
import { type CooldownUser } from './CooldownUser'
import { type User } from './User'
import { type GuildChannels } from './GuildChannels'

export interface Session {
  guildId: Snowflake
  channelId: Snowflake
  usersInCooldown: CooldownUser[]
  ignoredUsers: User[]
  rememberedUsers: User[]
  channels: GuildChannels
}
