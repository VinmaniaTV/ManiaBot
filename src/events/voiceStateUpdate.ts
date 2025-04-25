import { Events, VoiceState, GuildMember, VoiceBasedChannel } from 'discord.js';
import User from '../models/User';

// Initialize global Maps if they don't exist
if (!global.voiceXPTimers) {
    global.voiceXPTimers = new Map<string, NodeJS.Timeout>();
}
if (!global.voiceManiacoinsTimers) {
    global.voiceManiacoinsTimers = new Map<string, NodeJS.Timeout>();
}

const BASE_MANIACOINS = 10.0;
const BASE_MULTIPLIER = 1.0;
const MULTIPLIER_PER_LEVEL = 0.1;

// Timer intervals in milliseconds
const XP_TIMER_INTERVAL = 300000; // 5 minutes
const MANIACOINS_TIMER_INTERVAL = 300000; // 5 minutes

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
            if (member.voice.channel) {
                await user.calculateLevel(member.voice.channel, member);
            }

            await user.save();
        } catch (error) {
            console.error('Error in voice XP timer:', error);
        }
    }, XP_TIMER_INTERVAL);

    // Store the timer
    global.voiceXPTimers.set(`${userId}-${guildId}`, timer);
}

// Function to start Maniacoins timer for a user
export async function startManiacoinsTimer(userId: string, guildId: string, member: GuildMember) {
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

            // Add Maniacoins with level multiplier
            const levelMultiplier = BASE_MULTIPLIER + ((user.level - 1) * MULTIPLIER_PER_LEVEL);
            const maniacoinsToAdd = BASE_MANIACOINS * levelMultiplier;
            user.maniacoins += maniacoinsToAdd;

            await user.save();
        } catch (error) {
            console.error('Error in voice Maniacoins timer:', error);
        }
    }, MANIACOINS_TIMER_INTERVAL);

    // Store the timer
    global.voiceManiacoinsTimers.set(`${userId}-${guildId}`, timer);
}

// Function to stop XP timer for a user
export function stopXPTimer(userId: string, guildId: string) {
    const timer = global.voiceXPTimers.get(`${userId}-${guildId}`);
    if (timer) {
        clearInterval(timer);
        global.voiceXPTimers.delete(`${userId}-${guildId}`);
    }
}

// Function to stop Maniacoins timer for a user
export function stopManiacoinsTimer(userId: string, guildId: string) {
    const timer = global.voiceManiacoinsTimers.get(`${userId}-${guildId}`);
    if (timer) {
        clearInterval(timer);
        global.voiceManiacoinsTimers.delete(`${userId}-${guildId}`);
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
                await startManiacoinsTimer(userId, guildId, newState.member);
            }
        }
        // User left a voice channel or moved to AFK
        else if ((oldState.channelId && !newState.channelId) || 
                 (newState.channelId && newState.channel?.id === newState.guild.afkChannelId)) {
            stopXPTimer(userId, guildId);
            stopManiacoinsTimer(userId, guildId);
        }
        // User switched channels
        else if (oldState.channelId !== newState.channelId) {
            // If moving to AFK channel, stop timers
            if (newState.channel?.id === newState.guild.afkChannelId) {
                stopXPTimer(userId, guildId);
                stopManiacoinsTimer(userId, guildId);
            }
            // If moving from AFK to regular channel, start timers
            else if (oldState.channel?.id === newState.guild.afkChannelId && newState.channel) {
                await startXPTimer(userId, guildId, newState.member);
                await startManiacoinsTimer(userId, guildId, newState.member);
            }
        }
    }
}; 