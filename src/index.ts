import { PrismaClient } from '@prisma/client'
import { SapphireClient, container } from '@sapphire/framework'
import { ActivityType, GatewayIntentBits } from 'discord.js'
import { config } from 'dotenv'
config()

const token = process.env.BOT_TOKEN

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds],
  loadMessageCommandListeners: true,
  presence: {
    activities: [{
      name: 'custom',
      type: ActivityType.Custom,
      state: 'Controlling Access'
    }]
  }
})

// Database init
const prisma = new PrismaClient()

declare module '@sapphire/pieces' {
  interface Container {
    db: PrismaClient
  }
}

container.db = prisma

client.login(token).catch((error) => { console.log(`The bot has crashed.\n ${error}`) })
