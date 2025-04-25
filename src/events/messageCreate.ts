import { Events, Message, BaseGuildTextChannel, GuildMember } from 'discord.js';
import User from '../models/User';

const XP_COOLDOWN = 3600000; // 1 hour in milliseconds
const MIN_XP = 15;
const MAX_XP = 25;
const MANIACOINS_COOLDOWN = 300000; // 5 minutes in milliseconds
const BASE_MANIACOINS = 10.0;
const BASE_MULTIPLIER = 1.0;
const MULTIPLIER_PER_LEVEL = 0.1;

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        // Ignore messages from bots
        if (message.author.bot) return;

        try {
            let user = await User.findOne({
                userId: message.author.id,
                guildId: message.guildId
            });

            if (!user) {
                user = new User({
                    userId: message.author.id,
                    guildId: message.guildId
                });

                await user.save();
            }

            // Check if enough time has passed since last message
            const now = new Date();
            const timeDiff = now.getTime() - user.lastMessageTimestamp.getTime();

            if (timeDiff >= XP_COOLDOWN) {
                // Update last message timestamp
                user.lastMessageTimestamp = now;

                // Add random XP
                //const xpToAdd = Math.floor(Math.random() * (MAX_XP - MIN_XP + 1)) + MIN_XP;
                //user.xp += xpToAdd;
                user.xp++;

                // Check for level up
                await user.calculateLevel(message.channel as BaseGuildTextChannel, message.member as GuildMember);

                await user.save();
            }

            // Award Maniacoins with a separate cooldown
            if (timeDiff >= MANIACOINS_COOLDOWN) {
                const levelMultiplier = BASE_MULTIPLIER + ((user.level - 1) * MULTIPLIER_PER_LEVEL);
                const maniacoinsToAdd = BASE_MANIACOINS * levelMultiplier;
                user.maniacoins += maniacoinsToAdd;
                await user.save();
            }
        } catch (error) {
            console.error('Error in messageCreate event:', error);
        }
    }
}; 