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
        const connection = (0, voice_1.getVoiceConnection)(interaction.guildId);
        //queue.songs = [];
        //queue.connection.destroy();
        connection.destroy();
        await interaction.reply('La musique a été arrêtée.');
    }
};
