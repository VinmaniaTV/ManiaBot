"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
exports.command = {
    name: 'stop',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('stop')
        .setDescription('Arrêter la musique en cours.'),
    async execute(interaction) {
        // if the bot is connected to a voice channel
        const connection = (0, voice_1.getVoiceConnection)(interaction.guildId);
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
};
