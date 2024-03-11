# Bouncer Bot (discord-bouncer-bot)

A Discord bot that helps you move people to a designated private channel.

Made especially for streamers that have a Streaming VC and not want anyone to join it and talk, but it can be used for any purpose.

Currently a private bot, you can build it yourself and invite it to your server.

## Setup

First, invite the bot to your server. Make sure to keep the default permissions, the bot **must be able to**:

- Join Voice channels
- Speak
- See text channels
- Send messages
- Move members

Once the bot joins, run the **/bouncersetup show-status** command to show the current status and set it up.

![image](https://github.com/MiguelHigueraDev/discord-bouncer-bot/assets/133175356/02dcd37c-38b0-4fa9-badb-38dfd79d8040)

You have to define **three channels** for the bot to work properly by using the commands provided:

- Private voice channel: This is going to be the private voice channel the bot will help you move people to.
- Waiting voice channel: This channel should be publicly available, when people join this channel the bot will send a join request to the designated text channel.
- Text channel: This should be a private text channel where all the moderators and admins will have the power to accept or deny the join requests.

The bot will tell you if it doesn't have permission to perform actions in those channels.

Once you define the channels using the `/bouncersetup set-private-vc, set-waiting-vc, and set-text-channel` commands, you'll get something like this when checking the status again:

![image](https://github.com/MiguelHigueraDev/discord-bouncer-bot/assets/133175356/827282c5-ef10-4621-9d62-3875ef93b2bd)

You can then enable the bot by using **/bouncersetup enable**. Setup is done!

## How to use

Once someone joins the private channel (can be anyone), a **session** will be started.

![image](https://github.com/MiguelHigueraDev/discord-bouncer-bot/assets/133175356/54dea17b-87fd-4702-8533-ea642ee9a96c)

While people remain in that voice channel, the session will stay open. When people join the designated waiting room, the bot will send the join request to the designated text channel and join the **private** VC to play an audio cue to notify. This is helpful because Streamer Mode disables all notifications by default.

To prevent spam, the notifications have a 15 minute cooldown per user.

![image](https://github.com/MiguelHigueraDev/discord-bouncer-bot/assets/133175356/47033bc8-ada9-4ec1-b126-4b5f8ac758f1)

You have three options:

1. Move: This moves the member to the private VC and clears their cooldown.
2. Move + remember: This moves the member to the private VC, clears their cooldown, and also **moves them again in case they disconnect and join the waiting room again**. This lasts for the entire session.
3. Ignore for this session: This will prevent any further notifications sent by this member for the rest of the session.

Once all people leave the private VC, the session will end. All remembered and ignored users will be cleared from the bot's memory and the bot won't notify of people joining the waiting room anymore.

![image](https://github.com/MiguelHigueraDev/discord-bouncer-bot/assets/133175356/8c88b0aa-9cc2-4127-93d0-7d95ab719811)

A new session can be started by joining the private VC again.

## How to build

First, you have to set up a database using a system that's supported by Prisma like MySQL or PostgreSQL. [Read up here](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/connect-your-database-typescript-postgresql) and set up the connection url in your .env file.

I use MySQL for my own instance.

As with all Discord bots, you have to also create a new application if you haven't in [Discord's Developer Portal](https://discord.com/developers/applications) and get your bot token and client id/secret.

1. Clone the repo
2. Set up your database using the instructions provided above
3. Set up your bot token and client id/secrets in the .env file located in `src` (rename it to .env instead of .env.example)
4. Install all your dependencies using your package manager of choice. For example: `npm install`
6. Navigate to the `src` folder and run `npx prisma push` to sync your database with the schema and `npx prisma generate` to generate your Prisma Client to be able to interact with the database
7. In the `src` folder run `tsc` to compile all TypeScript into JavaScript.
8. The output will be in the dist folder. You can run the bot by using `node index.js`
9. Set the bot up using the tutorial above and enjoy!

## Built with

- TypeScript
- Sapphire Framework
- Prisma
