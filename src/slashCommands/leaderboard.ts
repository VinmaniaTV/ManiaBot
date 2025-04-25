import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../types';
import MongoUser from '../models/User';

type LeaderboardType = 'xp' | 'maniacoins';

export const command: SlashCommand = {
    name: 'leaderboard',
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Affiche le classement des niveaux et des Maniacoins')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Le type de classement à afficher')
                .setRequired(true)
                .addChoices(
                    { name: 'Niveaux', value: 'xp' },
                    { name: 'Maniacoins', value: 'maniacoins' }
                )),
    async execute(interaction: CommandInteraction) {
        try {
            const type = interaction.options.get('type')?.value as LeaderboardType;
            const guildId = interaction.guildId;

            if (!guildId) {
                await interaction.reply({
                    content: 'Cette commande ne peut être utilisée que dans un serveur.',
                    ephemeral: true
                });
                return;
            }

            // Get top 10 users for the specified type
            const sortField = type === 'xp' ? 'xp' : 'maniacoins';
            const users = await MongoUser.find({ guildId })
                .sort({ [sortField]: -1 })
                .limit(10);

            if (users.length === 0) {
                await interaction.reply({
                    content: 'Aucun utilisateur trouvé dans ce serveur.',
                    ephemeral: true
                });
                return;
            }

            // Get the user's rank if they're not in top 10
            let userRank = null;
            let userValue = null;
            const isUserInTop10 = users.some(user => user.userId === interaction.user.id);
            
            if (!isUserInTop10) {
                const userCount = await MongoUser.countDocuments({ 
                    guildId,
                    [sortField]: { $gt: 0 }
                });
                
                const user = await MongoUser.findOne({
                    userId: interaction.user.id,
                    guildId
                });

                if (user) {
                    const rank = await MongoUser.countDocuments({
                        guildId,
                        [sortField]: { $gt: user[sortField] }
                    }) + 1;

                    userRank = rank;
                    userValue = type === 'xp' ? 
                        `Niveau ${user.level} (${user.xp} XP)` :
                        `${Math.floor(user.maniacoins)} 💰`;
                }
            }

            // Fetch user data for display names
            const userPromises = users.map(user => 
                interaction.guild?.members.fetch(user.userId)
                    .then(member => member.user.username)
                    .catch(() => 'Utilisateur inconnu')
            );
            const usernames = await Promise.all(userPromises);

            // Create the leaderboard embed
            const embed = new EmbedBuilder()
                .setTitle(`Classement des ${type === 'xp' ? 'niveaux' : 'Maniacoins'}`)
                .setColor('#0099ff')
                .setTimestamp();

            // Add fields for each user
            const fields = users.map((user, index) => {
                const username = usernames[index];
                const value = type === 'xp' ? 
                    `Niveau ${user.level} (${user.xp} XP)` :
                    `${Math.floor(user.maniacoins)} 💰`;
                
                return {
                    name: `${index + 1}. ${username}`,
                    value: value,
                    inline: false
                };
            });

            embed.addFields(fields);

            // Add user's rank if they're not in top 10
            if (userRank && userValue) {
                embed.addFields({
                    name: '\u200B', // Zero-width space for separation
                    value: '...',
                    inline: false
                }, {
                    name: `${userRank}. ${interaction.user.username}`,
                    value: userValue,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in leaderboard command:', error);
            await interaction.reply({
                content: 'Une erreur est survenue lors de la récupération du classement.',
                ephemeral: true
            });
        }
    }
}; 