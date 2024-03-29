/*
import { Command } from '@sapphire/framework'
import { type ChatInputCommandInteraction, type InteractionResponse, PermissionFlagsBits } from 'discord.js'
import userHandler from '../lib/database/userHandler'

export class AllowlistCommand extends Command {
  public constructor (context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'allowlist',
      description: 'See allowlisted users in the server, or add/remove them from it.'
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
          command.setName('add').setDescription('Add a user to the allowlist.')
            .addUserOption((option) =>
              option
                .setName('user')
                .setDescription('The user to add to the allowlist.')
                .setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command.setName('remove').setDescription('Remove a user from the allowlist.')
            .addUserOption((option) =>
              option
                .setName('user')
                .setDescription('The user to remove from the allowlist.')
                .setRequired(true)
            )
        ), {
      idHints: ['1215894967042441216']
    })
  }

  public async chatInputRun (interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean>> {
    const subcommand = interaction.options.getSubcommand()
    if (subcommand == null) {
      // Display allowlist (paginate it)
    }

    const user = interaction.options.getUser('user', true)
    const userId = user.id
    const displayName = user.displayName

    if (subcommand === 'add') {
      return await this.addUserToAllowlist(interaction, userId, displayName)
    }

    if (subcommand === 'remove') {
      return await this.removeUserFromAllowlist(interaction, userId, displayName)
    }

    return await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true })
  }

  public async addUserToAllowlist (interaction: ChatInputCommandInteraction, userId: string, displayName: string): Promise<InteractionResponse<boolean>> {
    if (interaction.guild == null) {
      return await interaction.reply({ content: 'Error fetching details from the server.', ephemeral: true })
    }

    const toggled = await userHandler.toggleAllowlistStatus(userId, interaction.guild.id, true)

    if (!toggled) {
      return await interaction.reply({ content: `Error adding user **${displayName}** to allowlist.`, ephemeral: true })
    }

    return await interaction.reply({ content: `User **${displayName}** added to allowlist.`, ephemeral: true })
  }

  public async removeUserFromAllowlist (interaction: ChatInputCommandInteraction, userId: string, displayName: string): Promise<InteractionResponse<boolean>> {
    if (interaction.guild == null) {
      return await interaction.reply({ content: 'Error fetching details from the server.', ephemeral: true })
    }

    const toggled = await userHandler.toggleAllowlistStatus(userId, interaction.guild.id, false)

    if (!toggled) {
      return await interaction.reply({ content: `Error removing user **${displayName}** from allowlist.`, ephemeral: true })
    }

    return await interaction.reply({ content: `User **${displayName}** removed from allowlist.`, ephemeral: true })
  }
}

*/
