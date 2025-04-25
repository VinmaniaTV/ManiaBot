import { Client, Collection, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { glob, readdirSync } from 'fs';
import { join } from 'path';
import { SlashCommand, SongQueue } from './types';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
});

client.slashCommands = new Collection<string, SlashCommand>();

// List of queues for each server
global.queueSongs = new Array<SongQueue>();

// List of connected user in a voiceChannel
global.voiceXPTimers = new Map<string, NodeJS.Timeout>();
global.voiceManiacoinsTimers = new Map<string, NodeJS.Timeout>();

const handlersDirs = join(__dirname, './handlers');

readdirSync(handlersDirs).forEach((file) => {
    require(`${handlersDirs}/${file}`)(client);
});

client.login(process.env.TOKEN);