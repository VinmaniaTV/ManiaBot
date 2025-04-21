import mongoose, { Document, Model } from 'mongoose';
import { GuildMember, TextChannel, BaseGuildTextChannel, VoiceBasedChannel, ChannelType } from 'discord.js';

interface IUser {
    userId: string;
    guildId: string;
    xp: number;
    level: number;
    lastMessageTimestamp: Date;
}

interface IUserMethods {
    calculateLevel(channel?: BaseGuildTextChannel | VoiceBasedChannel, member?: GuildMember): Promise<number>;
    canLevelUp(): boolean;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({
    userId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastMessageTimestamp: { type: Date, default: Date.now }
});

// Compound index for userId and guildId
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

// Calculate level based on XP and update if level up occurs
userSchema.method('calculateLevel', async function(channel?: BaseGuildTextChannel | VoiceBasedChannel, member?: GuildMember) {
    const BASE_XP = 100;
    const EXPONENT = 1.8;
    
    // Calculate level by checking total XP needed
    let level = 1;
    let totalXpNeeded = 0;
    
    let xpForNextLevel = 0;
    while (true) {
        if (level === 1) {
            xpForNextLevel = BASE_XP; // Level 1: 0-100
        } else {
            xpForNextLevel = Math.floor(xpForNextLevel * Math.pow(EXPONENT, 1));
        }
        totalXpNeeded += xpForNextLevel;
        
        if (this.xp < totalXpNeeded) {
            break;
        }
        level++;
    }
    
    if (level > this.level) {
        this.level = level;
        await this.save();
        
        // Send level up message if member is provided
        if (member) {
            let targetChannel: BaseGuildTextChannel | undefined;
            
            if (channel) {
                if (channel.type === ChannelType.GuildText) {
                    targetChannel = channel as BaseGuildTextChannel;
                } else if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                    // For voice channels, try to use the system channel
                    targetChannel = member.guild.systemChannel || undefined;
                    
                    // If no system channel, find any text channel
                    if (!targetChannel) {
                        targetChannel = member.guild.channels.cache.find(c => 
                            c.type === ChannelType.GuildText && 
                            c.permissionsFor(member.guild.members.me!)?.has('SendMessages')
                        ) as BaseGuildTextChannel | undefined;
                    }
                }
            }
            
            if (targetChannel) {
                await targetChannel.send(`🎉 Félicitations ${member}! Tu es maintenant niveau ${level}! 🎉`);
            }
        }
    }
    return level;
});

// Check if user can level up
userSchema.method('canLevelUp', async function() {
    const newLevel = await this.calculateLevel();
    return newLevel > this.level;
});

export type UserDocument = Document<unknown, {}, IUser> & IUser & IUserMethods;
export default mongoose.model<IUser, UserModel>('User', userSchema); 