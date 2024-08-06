"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const event = {
    name: discord_js_1.Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        if (!interaction.isChatInputCommand())
            return;
        const command = interaction.client.slashCommands.get(interaction.commandName);
        if (!command)
            return;
        try {
            await command.execute(interaction);
        }
        catch (error) {
            console.error(error);
            if (interaction.replied) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                return;
            }
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
};
exports.default = event;
