const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const SettingsManager = require('../../managers/SettingsManager');
const config = require('../../../config.js');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure the casino bot settings for your server.')
        // Require admin permissions at the Discord API level as well
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setchannel')
                .setDescription('Set the designated channel for a specific command category.')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('The command category to restrict')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Casino / Games', value: 'casino' },
                            { name: 'Bot / Economy', value: 'bot' },
                            { name: 'Admin / Setup', value: 'admin' }
                        ))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to restrict these commands to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clearchannel')
                .setDescription('Remove the channel restriction for a category.')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('The command category to unrestrict')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Casino / Games', value: 'casino' },
                            { name: 'Bot / Economy', value: 'bot' },
                            { name: 'Admin / Setup', value: 'admin' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View the current server configuration.')),

    async execute(interaction) {
        // Enforce Administrator locally just in case
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You must be an Administrator to use this command.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (subcommand === 'setchannel') {
            const category = interaction.options.getString('category');
            const channel = interaction.options.getChannel('channel');

            const success = SettingsManager.setChannel(guildId, category, channel.id);
            if (success) {
                return interaction.reply({ content: `✅ Successfully set the **${category}** channel to <#${channel.id}>.`, ephemeral: true });
            } else {
                return interaction.reply({ content: `❌ Failed to update settings. Unknown category.`, ephemeral: true });
            }

        } else if (subcommand === 'clearchannel') {
            const category = interaction.options.getString('category');

            const success = SettingsManager.setChannel(guildId, category, null);
            if (success) {
                return interaction.reply({ content: `✅ Successfully removed the channel restriction for **${category}** commands. They can now be used anywhere.`, ephemeral: true });
            } else {
                return interaction.reply({ content: `❌ Failed to update settings. Unknown category.`, ephemeral: true });
            }

        } else if (subcommand === 'view') {
            const settings = SettingsManager.getSettings(guildId);

            const formatChannelInfo = (channelId) => {
                return channelId ? `<#${channelId}>` : '*Not Set (Allowed Anywhere)*';
            };

            const embed = new EmbedBuilder()
                .setColor(config.themeColor)
                .setTitle('⚙️ Server Configuration')
                .setDescription('Here are the current channel restrictions for this server. If a category is not set, those commands can be used in any channel.')
                .addFields(
                    { name: '🎰 Casino / Games', value: formatChannelInfo(settings.casino_channel_id), inline: false },
                    { name: '💰 Bot / Economy', value: formatChannelInfo(settings.bot_channel_id), inline: false },
                    { name: '🛡️ Admin / Setup', value: formatChannelInfo(settings.admin_channel_id), inline: false }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    }
};
