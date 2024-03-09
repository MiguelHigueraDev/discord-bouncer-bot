import { type Snowflake } from 'discord.js'
import { type User } from './User'

export interface Guild {
  id: Snowflake
  name: string
  users: User[]
}
