import mongoose, { Document, Model } from 'mongoose';

interface IUser {
    userId: string;
    guildId: string;
    xp: number;
    level: number;
    lastMessageTimestamp: Date;
}

interface IUserMethods {
    calculateLevel(): number;
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

// Calculate level based on XP
userSchema.method('calculateLevel', function() {
    return Math.floor(0.1 * Math.sqrt(this.xp));
});

// Check if user can level up
userSchema.method('canLevelUp', function() {
    const newLevel = this.calculateLevel();
    return newLevel > this.level;
});

export type UserDocument = Document<unknown, {}, IUser> & IUser & IUserMethods;
export default mongoose.model<IUser, UserModel>('User', userSchema); 