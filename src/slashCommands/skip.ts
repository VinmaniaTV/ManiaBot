import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { AudioPlayerStatus } from "@discordjs/voice";

export const command: SlashCommand = {
    name: 'skip',
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Passe la musique actuelle.'),
    async execute(interaction) {
        const queue = global.queueSongs.find(queue => queue.guildId === interaction.guildId);
        if (!queue || queue.player.state.status !== AudioPlayerStatus.Playing) {
            await interaction.reply('Aucune musique n\'est en cours de lecture.');
            return;
        }
        queue.player.stop();
        await interaction.reply('Musique passée.');
    }
}