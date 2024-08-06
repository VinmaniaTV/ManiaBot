import { BaseGuildVoiceChannel, CommandInteraction, GuildTextBasedChannel, SlashCommandBuilder, TextChannel, ThreadChannel, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
        CLIENT_ID: string;
        TOKEN: string;
    }
  }
  var queueSongs: SongQueue[];
}

declare module 'discord.js' {
    export interface Client {
        slashCommands: Collection<string, SlashCommand>;
    }
}

export interface BotEvent {
    name: string;
    once?: boolean | false;
    execute: (...args) => void;
}

export interface SlashCommand {
    name: string;
    data: SlashCommandBuilder | any;
    async execute: (interaction: CommandInteraction) => Promise<void>;
}

export interface SongQueue {
    guildId: string;
    voiceChannel: ThreadChannel;
    connection: VoiceConnection;
    songs: queueSong[];
    volume: number;
    playing: boolean;
    player: AudioPlayer;
}

export interface Song {
    title: string;
    url: string;
    thumbnail: string;
    duration: number;
    requester: string;
    resource: AudioResource;
}

export {}