"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
exports.command = {
    name: 'join',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('join')
        .setDescription('Rejoindre un salon vocal.'),
    async execute(interaction) {
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        const voiceChannel = member?.voice.channelId ? await interaction.guild?.channels.fetch(member.voice.channelId) : null;
        if (!voiceChannel) {
            await interaction.reply('Vous devez être dans un salon vocal pour utiliser cette commande.');
            return;
        }
        // Check if the bot is already connected to the same voice channel
        const connection = (0, voice_1.getVoiceConnection)(voiceChannel.guild.id);
        if (connection && connection.joinConfig.channelId === voiceChannel.id) {
            await interaction.reply('Le bot est déjà connecté à ce salon vocal.');
            return;
        }
        (0, voice_1.joinVoiceChannel)({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false
        });
        await interaction.reply(`Rejoins le salon vocal ${voiceChannel.name}`);
    }
};
