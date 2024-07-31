import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

export const command: SlashCommand = {
    name: 'ping',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche le ping du bot.'),
    async execute(interaction) {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`Pong! ${interaction.client.ws.ping}ms`)
                .setColor('#ff8e4d')  
            ]
        })
    }
}