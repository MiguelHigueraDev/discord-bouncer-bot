import { SapphireClient } from '@sapphire/framework'
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

client.login(token).catch((error) => { console.log(`The bot has crashed.\n ${error}`) })
