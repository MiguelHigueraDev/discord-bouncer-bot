import { type Snowflake } from 'discord.js'
import { type CooldownUser } from './CooldownUser'

export interface CooldownGuild {
  id: Snowflake
  users: CooldownUser[]
}
