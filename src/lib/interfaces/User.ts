import { type Snowflake } from 'discord.js'

export interface User {
  id: Snowflake
  username: string
}
