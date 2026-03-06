const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');
const XPManager = require('../../managers/XPManager');
const BuffManager = require('../../managers/BuffManager');
const AchievementManager = require('../../managers/AchievementManager');
const { formatTime } = require('../../utils/time');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work for a small amount of money.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const user = EconomyManager.getUser(guildId, userId);
        const workCfg = config.economy.work;
        const now = Date.now();

        const COOLDOWN_MS = workCfg.cooldownHours * 60 * 60 * 1000;
        const timePassed = now - user.last_work;

        if (timePassed < COOLDOWN_MS) {
            const timeLeft = COOLDOWN_MS - timePassed;
            const embed = new EmbedBuilder()
                .setColor(config.errorColor)
                .setTitle('⏳ Resting')
                .setDescription(`You are too tired to work right now.\nTry again in **${formatTime(timeLeft)}**.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Calculate reward
        const basePayout = Math.floor(Math.random() * (workCfg.maxPayout - workCfg.minPayout + 1)) + workCfg.minPayout;
        const scenario = workCfg.scenarios[Math.floor(Math.random() * workCfg.scenarios.length)];

        // Phase 10: Buffs & Perks
        let multiplier = 1.0;
        let buffMsg = '';

        const hasBoost = BuffManager.hasActiveBuff(guildId, userId, 'buff_work_expires');
        if (hasBoost) {
            const boostItem = config.shop.categories.find(c => c.id === 'boosts').items.find(i => i.buffType === 'buff_work_expires');
            if (boostItem) {
                multiplier *= boostItem.effectAmount;
                buffMsg += `\n*⚡ Energy Drink Active (${boostItem.effectAmount}x)*`;
            }
        }

        const perkMulti = XPManager.getPerkModifier(guildId, userId, 'workMultiplierPerLevel');
        if (perkMulti > 0) {
            multiplier += perkMulti; // Additive perk scaling
            buffMsg += `\n*✨ Level Perk Active (+${(perkMulti * 100).toFixed(1)}%)*`;
        }

        const finalPayout = Math.floor(basePayout * multiplier);

        EconomyManager.addWallet(guildId, userId, finalPayout);
        EconomyManager.setCooldown(guildId, userId, 'last_work', now);
        EconomyManager.incrementWorkCount(guildId, userId); // Track for achievements

        // Phase 7: XP
        const xpAmount = Math.floor(Math.random() * (config.xpSystem.rewards.work.max - config.xpSystem.rewards.work.min + 1)) + config.xpSystem.rewards.work.min;
        const leveledUp = XPManager.addXp(guildId, userId, xpAmount);

        if (leveledUp) buffMsg += `\n**🆙 You leveled up!**`;

        const embed = new EmbedBuilder()
            .setColor(config.successColor)
            .setTitle(`${config.casinoEmoji} Hard Work Pays Off`)
            .setDescription(`${scenario}\n\nYou earned **$${finalPayout.toLocaleString()}**!${buffMsg}`)
            .setFooter({ text: config.footerBranding ? `${config.footerBranding} | New Wallet: $${(user.balance + finalPayout).toLocaleString()}` : `New Wallet: $${(user.balance + finalPayout).toLocaleString()}` });

        await interaction.reply({ embeds: [embed] });

        // Phase 12: Achievements
        AchievementManager.checkAll(guildId, userId, interaction);
    }
};
