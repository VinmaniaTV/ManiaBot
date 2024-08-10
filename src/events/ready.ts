import { ActivityType, Client, Events } from "discord.js";
import { BotEvent } from "../types";

const event: BotEvent = {
    name: Events.ClientReady,
    once: true,
    execute: (client: Client) => {
        client.user?.setPresence({
            activities: [{
                name: 'dev by Vinmania',
                state: 'Bot d\'Oradon Froster codé par Vinmania',
                type: ActivityType.Playing,
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            }],
            status: 'online'
        });
        console.log(`Logged in as ${client.user.tag}`);
    }
}

export default event;