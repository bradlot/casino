const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deposit')
        .setDescription('Deposit money from your wallet into your safe bank.')
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Amount to deposit or "all"')
                .setRequired(true)),
    async execute(interaction) {
        const amountArg = interaction.options.getString('amount');

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const user = EconomyManager.getUser(guildId, userId);

        let amount;
        if (amountArg.toLowerCase() === 'all') {
            amount = user.balance;
        } else {
            amount = parseInt(amountArg);
        }

        if (isNaN(amount) || amount <= 0) {
            return interaction.reply({ content: 'Invalid amount. Must be a positive number or `all`.', ephemeral: true });
        }

        if (user.balance < amount) {
            return interaction.reply({ content: `You don't have that much in your wallet! Wallet: **$${user.balance.toLocaleString()}**`, ephemeral: true });
        }

        const success = EconomyManager.deposit(guildId, userId, amount);
        if (success) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🏦 Deposit Successful')
                .setDescription(`You safely deposited **$${amount.toLocaleString()}** into your bank.`)
                .addFields(
                    { name: 'Wallet', value: `$${(user.balance - amount).toLocaleString()}`, inline: true },
                    { name: 'Bank', value: `$${(user.bank + amount).toLocaleString()}`, inline: true }
                );
            return interaction.reply({ embeds: [embed] });
        } else {
            return interaction.reply({ content: 'Transaction failed.', ephemeral: true });
        }
    }
};
