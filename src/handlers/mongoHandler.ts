import mongoose from 'mongoose';
import { Client } from 'discord.js';

module.exports = async (client: Client) => {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not defined in your .env file');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit the process if we can't connect to MongoDB
    }
} 