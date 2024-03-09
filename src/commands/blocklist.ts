import { Command } from '@sapphire/framework'
import { type ChatInputCommandInteraction, PermissionFlagsBits, type InteractionResponse } from 'discord.js'
import userHandler from '../lib/database/userHandler'

export class BlocklistCommand extends Command {
  public constructor (context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'blocklist',
      description: 'See blocklisted users in the server, or add/remove them from it.'
    })
  }

  public override registerApplicationCommands (registry: Command.Registry): void {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand((command) =>
          command.setName('add').setDescription('Add a user to the blocklist.')
            .addUserOption((option) =>
              option
                .setName('user')
                .setDescription('The user to add to the blocklist.')
                .setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command.setName('remove').setDescription('Remove a user from the blocklist.')
            .addUserOption((option) =>
              option
                .setName('user')
                .setDescription('The user to remove from the blocklist.')
                .setRequired(true)
            )
        ), {
      idHints: []
    })
  }

  public async chatInputRun (interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean>> {
    const subcommand = interaction.options.getSubcommand()
    if (subcommand == null) {
      // Display blocklist (paginate it)
    }

    const user = interaction.options.getUser('user', true)
    const userId = user.id
    const displayName = user.displayName

    if (subcommand === 'add') {
      return await this.addUserToBlocklist(interaction, userId, displayName)
    }

    if (subcommand === 'remove') {
      return await this.removeUserFromBlocklist(interaction, userId, displayName)
    }

    return await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true })
  }

  public async addUserToBlocklist (interaction: ChatInputCommandInteraction, userId: string, displayName: string): Promise<InteractionResponse<boolean>> {
    if (interaction.guild == null) {
      return await interaction.reply({ content: 'Error fetching details from the server.', ephemeral: true })
    }

    const toggled = await userHandler.toggleBlocklistStatus(userId, interaction.guild.id, true)

    if (!toggled) {
      return await interaction.reply({ content: `Error adding user **${displayName}** to blocklist.`, ephemeral: true })
    }

    return await interaction.reply({ content: `User **${displayName}** added to blocklist.`, ephemeral: true })
  }

  public async removeUserFromBlocklist (interaction: ChatInputCommandInteraction, userId: string, displayName: string): Promise<InteractionResponse<boolean>> {
    if (interaction.guild == null) {
      return await interaction.reply({ content: 'Error fetching details from the server.', ephemeral: true })
    }

    const toggled = await userHandler.toggleBlocklistStatus(userId, interaction.guild.id, false)

    if (!toggled) {
      return await interaction.reply({ content: `Error removing user **${displayName}** from blocklist.`, ephemeral: true })
    }

    return await interaction.reply({ content: `User **${displayName}** removed from blocklist.`, ephemeral: true })
  }
}
