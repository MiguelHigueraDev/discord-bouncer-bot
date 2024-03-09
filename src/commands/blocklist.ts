import { Command } from '@sapphire/framework'

export class BlocklistCommand extends Command {
  public constructor (context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'blocklist'

    })
  }
}
