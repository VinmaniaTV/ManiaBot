import { CommandInteraction, EmbedBuilder, SlashCommandBuilder, User } from 'discord.js';
import { SlashCommand } from '../types';
import MongoUser from '../models/User';

export const command: SlashCommand = {
    name: 'balance',
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Voir votre solde de Maniacoins')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('L\'utilisateur dont vous voulez voir le solde')
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
            });

            if (!user) {
                user = new MongoUser({
                    userId: targetUser.id,
                    guildId: interaction.guildId
                });
                await user.save();
            }

            const displayManiacoins = Math.floor(user.maniacoins);

            const embed = new EmbedBuilder()
                .setTitle(`Portefeuille de ${targetUser.username}`)
                .setColor('#FFD700')
                .addFields(
                    { name: 'Maniacoins', value: `${displayManiacoins} 💰`, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in balance command:', error);
            await interaction.reply({
                content: 'Une erreur est survenue lors de la récupération du solde.',
                ephemeral: true
            });
        }
    }
}; 