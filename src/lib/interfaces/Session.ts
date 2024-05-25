import { type Snowflake } from 'discord.js'
import { type CooldownUser } from './CooldownUser'
import { type User } from './User'

export interface Session {
  privateVcId: Snowflake
  usersInCooldown: CooldownUser[]
  ignoredUsers: User[]
  rememberedUsers: User[]
}
