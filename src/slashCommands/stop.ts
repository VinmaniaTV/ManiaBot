import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { getVoiceConnection } from "@discordjs/voice";

export const command: SlashCommand = {
    name: 'stop',
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Arrêter la musique en cours.'),
    async execute(interaction) {

        // if the bot is connected to a voice channel
        const connection = getVoiceConnection(interaction.guildId);

        if (connection) {
            connection.destroy();
            if (global.queueSongs[global.queueSongs.findIndex(q => q.guildId === interaction.guildId)]) {
                global.queueSongs[global.queueSongs.findIndex(q => q.guildId === interaction.guildId)].songs = [];
                global.queueSongs[global.queueSongs.findIndex(q => q.guildId === interaction.guildId)].playing = false;
                global.queueSongs[global.queueSongs.findIndex(q => q.guildId === interaction.guildId)].player.pause();
            }
        } 
        else {
            await interaction.reply('ManiaBot n\'est pas connecté à un salon vocal.');
            return;
        }
        
        await interaction.reply('La musique a été arrêtée.');
    }
}