"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
exports.command = {
    name: 'skip',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('skip')
        .setDescription('Passe la musique actuelle.'),
    async execute(interaction) {
        const queue = global.queueSongs.find(queue => queue.guildId === interaction.guildId);
        if (!queue || queue.player.state.status !== voice_1.AudioPlayerStatus.Playing) {
            await interaction.reply('Aucune musique n\'est en cours de lecture.');
            return;
        }
        queue.player.stop();
        await interaction.reply('Musique passée.');
    }
};
