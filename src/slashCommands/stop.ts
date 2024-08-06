import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { getVoiceConnection } from "@discordjs/voice";

export const command: SlashCommand = {
    name: 'stop',
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Arrêter la musique en cours.'),
    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guildId);

        //queue.songs = [];
        //queue.connection.destroy();
        connection.destroy();
        await interaction.reply('La musique a été arrêtée.');
    }
}