"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
module.exports = async (client) => {
    const body = [];
    let slashCommandsDir = (0, path_1.join)(__dirname, '../slashCommands');
    (0, fs_1.readdirSync)(slashCommandsDir).forEach((file) => {
        if (!file.endsWith('.js'))
            return;
        const command = require(`${slashCommandsDir}/${file}`).command;
        body.push(command.data.toJSON());
        client.slashCommands.set(command.name, command);
    });
    const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(discord_js_1.Routes.applicationCommands(process.env.CLIENT_ID), { body: body });
    }
    catch (error) {
        console.error(error);
    }
};
