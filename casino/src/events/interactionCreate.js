const { Events, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const SettingsManager = require('../managers/SettingsManager');
const config = require('../../config.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        const isAdmin = interaction.member?.permissions.has(PermissionsBitField.Flags.Administrator);

        // Phase 15: Global Casino Lock
        if (global.isCasinoLocked && !isAdmin) {
            const embed = new EmbedBuilder()
                .setColor(config.errorColor)
                .setTitle('🔒 Casino Locked')
                .setDescription('The casino is currently on lockdown by the Administrators. Please try again later.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Database-driven channel restriction System (Phase 17)
        if (command.data.name !== 'purge' && command.data.name !== 'setup') {
            const settings = SettingsManager.getSettings(interaction.guildId);

            if (command.category === 'games') {
                if (settings.casino_channel_id && interaction.channelId !== settings.casino_channel_id) {
                    return interaction.reply({ content: `Casino games can only be played in <#${settings.casino_channel_id}>.`, flags: MessageFlags.Ephemeral });
                }
            } else if (command.category === 'admin') {
                if (settings.admin_channel_id && interaction.channelId !== settings.admin_channel_id) {
                    return interaction.reply({ content: `Admin commands can only be used in <#${settings.admin_channel_id}>.`, flags: MessageFlags.Ephemeral });
                }
            } else {
                // Default to economy/bot commands 
                if (settings.bot_channel_id && interaction.channelId !== settings.bot_channel_id) {
                    return interaction.reply({ content: `Bot commands can only be used in <#${settings.bot_channel_id}>.`, flags: MessageFlags.Ephemeral });
                }
            }
        }


        try {
            await command.execute(interaction, client);
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) return; // Gracefully ignore Unknown Interaction and Already Acknowledged (caused by duplicate rogue bot instances or timeouts)
            console.error(`[Error] Executing command ${interaction.commandName}:`, error);

            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('There was an error while executing this command!');

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            }
        }
    },
};
