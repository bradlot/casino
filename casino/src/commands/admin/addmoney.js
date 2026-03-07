const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addmoney')
        .setDescription('Add money to a user\'s wallet.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to add money to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of money to add')
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

        EconomyManager.addWallet(interaction.guildId, targetUser.id, amount);

        const embed = new EmbedBuilder()
            .setColor(config.successColor)
            .setTitle('🛡️ Admin Command Executed')
            .setDescription(`Successfully added **$${amount.toLocaleString()}** to ${targetUser}'s wallet.`);

        return interaction.reply({ embeds: [embed] });
    }
};
