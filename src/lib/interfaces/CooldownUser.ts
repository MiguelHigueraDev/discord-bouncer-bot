import { type Snowflake } from 'discord.js'

export interface CooldownUser {
  id: Snowflake
  timestamp: number
}
