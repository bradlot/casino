const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbalance')
        .setDescription('Set a user\'s wallet balance.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to set the balance for')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The new balance amount')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');

        if (amount < 0) {
            return interaction.reply({ content: 'Amount cannot be negative.', ephemeral: true });
        }

        EconomyManager.setWallet(interaction.guildId, targetUser.id, amount);

        const embed = new EmbedBuilder()
            .setColor(config.themeColor)
            .setTitle('🛡️ Admin Command Executed')
            .setDescription(`Successfully set ${targetUser}'s wallet balance to **$${amount.toLocaleString()}**.`);

        return interaction.reply({ embeds: [embed] });
    }
};
