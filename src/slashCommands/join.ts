import { joinVoiceChannel } from "@discordjs/voice";
import { SlashCommandBuilder, ThreadChannel } from "discord.js";
import { SlashCommand } from "../types";

export const command: SlashCommand = {
    name: 'join',
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Rejoindre un salon vocal.'),
    async execute(interaction) {
        
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        const voiceChannel: ThreadChannel = member?.voice.channelId ? await interaction.guild?.channels.fetch(member.voice.channelId) as ThreadChannel : null;
        
        if (!voiceChannel) {
            await interaction.reply('Vous devez être dans un salon vocal pour utiliser cette commande.');
            return;
        }
        
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false
        })

        await interaction.reply(`Rejoins le salon vocal ${voiceChannel.name}`);
    }
}