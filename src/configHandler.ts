import { type Snowflake } from 'discord.js'
import * as fs from 'fs'

const FILE_PATH = './config.json'

interface AppConfig {
  privateVcId: Snowflake
  waitingVcId: Snowflake
  textChannelId: Snowflake
}

// Write config to a file
export function writeConfig (config: AppConfig): void {
  fs.writeFileSync(FILE_PATH, JSON.stringify(config, null, 2))
}

// Read config from file
export function readConfig (): AppConfig {
  const rawData = fs.readFileSync(FILE_PATH)
  return JSON.parse(rawData.toString()) as AppConfig
}
