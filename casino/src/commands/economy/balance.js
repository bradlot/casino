const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your current casino balance.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to check the balance of (optional)')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        if (targetUser.bot) {
            return interaction.reply({ content: "Bots don't have accounts!", ephemeral: true });
        }

        const userProfile = EconomyManager.getUser(interaction.guildId, targetUser.id);
        const netWorth = userProfile.balance + userProfile.bank;

        const embed = new EmbedBuilder()
            .setColor(config.themeColor)
            .setAuthor({ name: `${targetUser.username}'s Profile`, iconURL: targetUser.displayAvatarURL() })
            .addFields(
                { name: '🪙 Wallet (Risked)', value: `$${userProfile.balance.toLocaleString()}`, inline: true },
                { name: '🏦 Bank (Safe)', value: `$${userProfile.bank.toLocaleString()}`, inline: true },
                { name: '📈 Net Worth', value: `$${netWorth.toLocaleString()}`, inline: true }
            )
            .setTimestamp() // Replace empty footer to avoid discord API crash
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
