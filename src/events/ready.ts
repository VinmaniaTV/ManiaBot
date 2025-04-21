import { ActivityType, Client, Events } from "discord.js";
import { BotEvent } from "../types";
import { startXPTimer, stopXPTimer } from './voiceStateUpdate';
import User from '../models/User';

const event: BotEvent = {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
        client.user?.setPresence({
            activities: [{
                name: 'dev by Vinmania',
                state: 'Bot d\'Oradon Froster codé par Vinmania',
                type: ActivityType.Playing,
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            }],
            status: 'online'
        });
        console.log(`Ready! Logged in as ${client.user?.tag}`);

        // Initialize database entries and timers for users already in voice channels
        for (const guild of client.guilds.cache.values()) {
            for (const channel of guild.channels.cache.values()) {
                if (channel.isVoiceBased()) {
                    for (const member of channel.members.values()) {
                        if (!member.user.bot) {
                            // Create or update user in database
                            let user = await User.findOne({
                                userId: member.id,
                                guildId: guild.id
                            });

                            if (!user) {
                                user = new User({
                                    userId: member.id,
                                    guildId: guild.id
                                });
                                await user.save();
                            }

                            // Start XP timer
                            await startXPTimer(member.id, guild.id, member);
                        }
                    }
                }
            }
        }

        // Set up cleanup timer to run every 5 minutes
        setInterval(async () => {
            for (const [key, timer] of global.connectedUsers.entries()) {
                const [userId, guildId] = key.split('-');
                const guild = client.guilds.cache.get(guildId);
                
                if (guild) {
                    const member = await guild.members.fetch(userId).catch(() => null);
                    if (!member || !member.voice.channel) {
                        // User is no longer in a voice channel, stop their timer
                        stopXPTimer(userId, guildId);
                    }
                }
            }
        }, 300000); // Every 5 minutes
    }
}

export default event;