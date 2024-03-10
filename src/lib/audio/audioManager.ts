import { AudioPlayerStatus, createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel } from '@discordjs/voice'
import { type VoiceBasedChannel } from 'discord.js'
const connectToVoiceChannel = async (channel: VoiceBasedChannel): Promise<void> => {
  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator
    })
  } catch (error) {
    console.error(error)
  }
}

const playAudio = async (guildId: string): Promise<void> => {
  try {
    const connection = getVoiceConnection(guildId)
    if (connection == null) {
      return
    }

    const player = createAudioPlayer()
    const subscription = connection.subscribe(player)
    const resource = createAudioResource('')
    player.play(resource)

    // Disconnect after playing
    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy()
    })
  } catch (error) {
    console.error(error)
  }
}

const sendAudioNotification = async (channel: VoiceBasedChannel): Promise<void> => {
  await connectToVoiceChannel(channel)
  await playAudio(channel.guild.id)
}

const audioManager = {
  connectToVoiceChannel, playAudio, sendAudioNotification
}

export default audioManager
