import { type Snowflake } from 'discord.js'

export interface GuildChannels {
  privateVcId: Snowflake
  waitingVcId: Snowflake
  textChannelId: Snowflake
}
