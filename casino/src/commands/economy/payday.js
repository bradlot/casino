const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');
const EventManager = require('../../managers/EventManager');
const AchievementManager = require('../../managers/AchievementManager');
const { formatTime } = require('../../utils/time');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('payday')
        .setDescription('Claim your daily casino reward.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const user = EconomyManager.getUser(guildId, userId);

        const COOLDOWN_MS = config.economy.payday.cooldownHours * 60 * 60 * 1000;
        const now = Date.now();
        const timePassed = now - user.payday_last;

        if (timePassed < COOLDOWN_MS) {
            const timeLeft = COOLDOWN_MS - timePassed;
            const embed = new EmbedBuilder()
                .setColor(config.errorColor)
                .setTitle(`⏳ On Cooldown`)
                .setDescription(`You have already claimed your payday!\nCome back in **${formatTime(timeLeft)}**.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Live Event check (Phase 13)
        let payout = config.economy.payday.amount;
        let pTitle = `${config.casinoEmoji} Payday Claimed!`;
        const eventMulti = EventManager.getEventMultiplier('double_payday');

        if (eventMulti > 1.0) {
            payout = Math.floor(payout * eventMulti);
            pTitle = `🎉 DOUBLE PAYDAY ACTIVE! 🎉`;
        }

        // Give reward and set cooldown
        EconomyManager.addWallet(guildId, userId, payout);
        EconomyManager.setCooldown(guildId, userId, 'payday_last', now);

        const embed = new EmbedBuilder()
            .setColor(config.successColor)
            .setTitle(pTitle)
            .setDescription(`You have received your daily reward of **$${payout.toLocaleString()}**!`)
            .setFooter({ text: config.footerBranding ? `${config.footerBranding} | New Wallet: $${(user.balance + payout).toLocaleString()}` : `New Wallet: $${(user.balance + payout).toLocaleString()}` });

        await interaction.reply({ embeds: [embed] });

        // Background Achievement Check
        AchievementManager.checkAll(guildId, userId, interaction);
    }
};
