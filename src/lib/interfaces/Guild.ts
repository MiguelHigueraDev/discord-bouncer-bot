import { type Snowflake } from 'discord.js'
import { type Session } from './Session'

export interface Guild {
  id: Snowflake
  sessions: Session[]
  waitingVcId: Snowflake
  textChannelId: Snowflake
}
