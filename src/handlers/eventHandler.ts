import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { BotEvent } from "../types";

module.exports = (client: Client) => {
    let eventsDir = join(__dirname, '../events');

    readdirSync(eventsDir).forEach((file) => {
        if (!file.endsWith('.js')) return;

        try {
            const event: BotEvent = require(`${eventsDir}/${file}`).default;
            
            if (!event || !event.name || !event.execute) {
                console.error(`Invalid event file: ${file}`);
                return;
            }

            event.once
                ? client.once(event.name, (...args) => event.execute(...args))
                : client.on(event.name, (...args) => event.execute(...args));

            console.log(`Event ${event.name} loaded`);
        } catch (error) {
            console.error(`Error loading event ${file}:`, error);
        }
    });
}