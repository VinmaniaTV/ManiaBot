"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const event = {
    name: discord_js_1.Events.ClientReady,
    once: true,
    execute: (client) => {
        client.user?.setPresence({
            activities: [{
                    name: 'dev by Vinmania',
                    state: 'Bot d\'Oradon Froster codé par Vinmania',
                    type: discord_js_1.ActivityType.Playing,
                    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                }],
            status: 'online'
        });
        console.log(`Logged in as ${client.user.tag}`);
    }
};
exports.default = event;
