const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw money from your bank into your wallet.')
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Amount to withdraw or "all"')
                .setRequired(true)),
    async execute(interaction) {
        const amountArg = interaction.options.getString('amount');

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const user = EconomyManager.getUser(guildId, userId);

        let amount;
        if (amountArg.toLowerCase() === 'all') {
            amount = user.bank;
        } else {
            amount = parseInt(amountArg);
        }

        if (isNaN(amount) || amount <= 0) {
            return interaction.reply({ content: 'Invalid amount. Must be a positive number or `all`.', ephemeral: true });
        }

        if (user.bank < amount) {
            return interaction.reply({ content: `You don't have that much in your bank! Bank: **$${user.bank.toLocaleString()}**`, ephemeral: true });
        }

        const success = EconomyManager.withdraw(guildId, userId, amount);
        if (success) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🏦 Withdrawal Successful')
                .setDescription(`You withdrew **$${amount.toLocaleString()}** out of your bank.`)
                .addFields(
                    { name: 'Wallet', value: `$${(user.balance + amount).toLocaleString()}`, inline: true },
                    { name: 'Bank', value: `$${(user.bank - amount).toLocaleString()}`, inline: true }
                );
            return interaction.reply({ embeds: [embed] });
        } else {
            return interaction.reply({ content: 'Transaction failed.', ephemeral: true });
        }
    }
};
