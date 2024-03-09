import { Command } from '@sapphire/framework'
import { type ChatInputCommandInteraction, PermissionFlagsBits, type InteractionResponse } from 'discord.js'

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

    if (subcommand === 'add') {
      const userId = interaction.options.getUser('user', true).id
      return await this.addUserToBlocklist(interaction, userId)
    }

    if (subcommand === 'remove') {
      const userId = interaction.options.getUser('user', true).id
      return await this.removeUserFromBlocklist(interaction, userId)
    }

    return await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true })
  }

  public async addUserToBlocklist (interaction: ChatInputCommandInteraction, userId: string): Promise<InteractionResponse<boolean>> {

  }

  public async removeUserFromBlocklist (interaction: ChatInputCommandInteraction, userId: string): Promise<InteractionResponse<boolean>> {

  }
}
