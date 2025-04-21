import { Events, VoiceState, GuildMember } from 'discord.js';
import User from '../models/User';

// Initialize global Map if it doesn't exist
if (!global.connectedUsers) {
    global.connectedUsers = new Map<string, NodeJS.Timeout>();
}

// Function to start XP timer for a user
export async function startXPTimer(userId: string, guildId: string, member: GuildMember) {
    const timer = setInterval(async () => {
        try {
            let user = await User.findOne({
                userId: userId,
                guildId: guildId
            });

            if (!user) {
                user = new User({
                    userId: userId,
                    guildId: guildId
                });

                await user.save();
            }

            // Add XP
            user.xp++;

            // Check for level up
            const newLevel = user.calculateLevel();
            if (newLevel > user.level) {
                user.level = newLevel;
                const channel = member.voice.channel;
                if (channel) {
                    await channel.send(`🎉 Félicitations ${member}! Tu es maintenant niveau ${newLevel}! 🎉`);
                }
            }

            await user.save();
        } catch (error) {
            console.error('Error in voice XP timer:', error);
        }
    }, 300000); // Every 5 minutes

    // Store the timer
    global.connectedUsers.set(`${userId}-${guildId}`, timer);
}

// Function to stop XP timer for a user
export function stopXPTimer(userId: string, guildId: string) {
    const timer = global.connectedUsers.get(`${userId}-${guildId}`);
    if (timer) {
        clearInterval(timer);
        global.connectedUsers.delete(`${userId}-${guildId}`);
    }
}

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState: VoiceState, newState: VoiceState) {
        // Ignore bot users
        if (newState.member?.user.bot) return;

        const userId = newState.member?.id;
        const guildId = newState.guild.id;

        if (!userId || !guildId || !newState.member) return;

        // User joined a voice channel
        if (!oldState.channelId && newState.channelId) {
            // Check if the channel is not an AFK channel
            const newChannel = newState.channel;
            if (newChannel && newChannel.id !== newState.guild.afkChannelId) {
                await startXPTimer(userId, guildId, newState.member);
            }
        }
        // User left a voice channel or moved to AFK
        else if ((oldState.channelId && !newState.channelId) || 
                 (newState.channelId && newState.channel?.id === newState.guild.afkChannelId)) {
            stopXPTimer(userId, guildId);
        }
        // User switched channels
        else if (oldState.channelId !== newState.channelId) {
            // If moving to AFK channel, stop timer
            if (newState.channel?.id === newState.guild.afkChannelId) {
                stopXPTimer(userId, guildId);
            }
            // If moving from AFK to regular channel, start timer
            else if (oldState.channel?.id === newState.guild.afkChannelId && newState.channel) {
                await startXPTimer(userId, guildId, newState.member);
            }
        }
    }
}; 