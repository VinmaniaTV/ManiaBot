import { CommandInteraction, EmbedBuilder, SlashCommandBuilder, User } from 'discord.js';
import { SlashCommand } from '../types';
import { UserDocument } from '../models/User';
import MongoUser from '../models/User'

const XP_COOLDOWN = 60000; // 1 minute cooldown
const MIN_XP = 15;
const MAX_XP = 25;

export const command: SlashCommand = {
    name: 'level',
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Voir votre niveau et XP')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('L\'utilisateur dont vous voulez voir le niveau')
                .setRequired(false)),
    async execute(interaction: CommandInteraction) {
        let targetUser: User = interaction.user;
        const userId = interaction.options.get('user')?.value as string;

        if (userId) {
            const guildMember = await interaction.guild?.members.fetch(userId);
            if (guildMember?.user) {
                targetUser = guildMember.user;
            }
        }

        try {
            let user = await MongoUser.findOne({
                userId: targetUser.id,
                guildId: interaction.guildId
            }) as UserDocument;

            if (!user) {
                user = new MongoUser({
                    userId: targetUser.id,
                    guildId: interaction.guildId
                }) as UserDocument;

                await user.save();
            }

            const xpForNextLevel = Math.pow(user.level * 10, 2);
            const currentLevelXp = Math.pow((user.level - 1) * 10, 2);
            const xpProgress = user.xp - currentLevelXp;
            const xpNeeded = xpForNextLevel - currentLevelXp;
            const progressBarLength = 20;
            const progress = Math.floor((xpProgress / xpNeeded) * progressBarLength);
            const progressBar = '█'.repeat(progress) + '░'.repeat(progressBarLength - progress);

            const embed = new EmbedBuilder()
                .setTitle(`Niveau de ${targetUser.username}`)
                .setColor('#0099ff')
                .addFields(
                    { name: 'Niveau', value: user.level.toString(), inline: true },
                    { name: 'XP', value: user.xp.toString(), inline: true },
                    { name: 'Progression', value: `${progressBar} ${xpProgress}/${xpNeeded} XP`, inline: false }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in level command:', error);
            await interaction.reply({
                content: 'Une erreur est survenue lors de la récupération du niveau.',
                ephemeral: true
            });
        }
    }
} 