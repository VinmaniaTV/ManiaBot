"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
exports.command = {
    name: 'ping',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche le ping du bot.'),
    async execute(interaction) {
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`Pong! ${interaction.client.ws.ping}ms`)
                    .setColor('#ff8e4d')
            ]
        });
    }
};
