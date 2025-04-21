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

            const BASE_XP = 100;
            const EXPONENT = 1.8;

            // Calculate total XP needed for current level
            let totalXpForCurrentLevel = 0;
            for (let i = 1; i < user.level; i++) {
                totalXpForCurrentLevel += Math.floor(BASE_XP * Math.pow(EXPONENT, i));
            }

            // Calculate XP needed for next level
            const xpForNextLevel = Math.floor(BASE_XP * Math.pow(EXPONENT, user.level));
            
            // Calculate XP progress in current level
            const xpProgress = user.xp - totalXpForCurrentLevel;
            
            const progressBarLength = 20;
            const progress = Math.floor((xpProgress / xpForNextLevel) * progressBarLength);
            const progressBar = '█'.repeat(progress) + '░'.repeat(progressBarLength - progress);

            const embed = new EmbedBuilder()
                .setTitle(`Niveau de ${targetUser.username}`)
                .setColor('#0099ff')
                .addFields(
                    { name: 'Niveau', value: user.level.toString(), inline: true },
                    { name: 'XP', value: user.xp.toString(), inline: true },
                    { name: 'Progression', value: `${progressBar} ${xpProgress}/${xpForNextLevel} XP`, inline: false },
                    { name: 'XP pour le prochain niveau', value: xpForNextLevel.toString(), inline: true },
                    { name: 'XP total pour le niveau actuel', value: totalXpForCurrentLevel.toString(), inline: true }
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