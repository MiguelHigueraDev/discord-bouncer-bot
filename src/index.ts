import { PrismaClient } from '@prisma/client'
import { SapphireClient, container } from '@sapphire/framework'
import { ActivityType, GatewayIntentBits } from 'discord.js'
import { config } from 'dotenv'
import { type Guild } from './lib/interfaces/Guild'
config()

// Database init
const prisma = new PrismaClient()

declare module '@sapphire/pieces' {
  interface Container {
    db: PrismaClient
    guilds: Guild[]
  }
}

container.db = prisma
container.guilds = []

const token = process.env.BOT_TOKEN

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  loadMessageCommandListeners: true,
  presence: {
    activities: [{
      name: 'custom',
      type: ActivityType.Custom,
      state: 'Controlling Access'
    }]
  }
})

client.login(token).catch((error) => { console.log(`The bot has crashed.\n ${error}`) })
