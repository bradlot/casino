const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removemoney')
        .setDescription('Remove money from a user\'s wallet.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to remove money from')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of money to remove')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');

        if (amount <= 0) {
            return interaction.reply({ content: 'Amount must be greater than 0.', ephemeral: true });
        }

        const userProfile = EconomyManager.getUser(targetUser.id);
        const actualRemove = Math.min(amount, userProfile.balance); // Don't throw them into negatives

        EconomyManager.removeWallet(targetUser.id, actualRemove);

        const embed = new EmbedBuilder()
            .setColor(config.errorColor)
            .setTitle('🛡️ Admin Command Executed')
            .setDescription(`Successfully removed **$${actualRemove.toLocaleString()}** from ${targetUser}'s wallet.`);

        return interaction.reply({ embeds: [embed] });
    }
};
