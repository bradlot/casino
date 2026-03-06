const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');
const XPManager = require('../../managers/XPManager');
const BuffManager = require('../../managers/BuffManager');
const StatsManager = require('../../managers/StatsManager');
const AchievementManager = require('../../managers/AchievementManager');
const { formatTime } = require('../../utils/time');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('Commit a high-risk crime for a large payout.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const user = EconomyManager.getUser(guildId, userId);
        const crimeCfg = config.economy.crime;
        const now = Date.now();

        const COOLDOWN_MS = crimeCfg.cooldownHours * 60 * 60 * 1000;
        const timePassed = now - user.last_crime;

        if (timePassed < COOLDOWN_MS) {
            const timeLeft = COOLDOWN_MS - timePassed;
            const embed = new EmbedBuilder()
                .setColor(config.errorColor)
                .setTitle('⏳ Lay Low')
                .setDescription(`The cops are still looking for you!\nTry again in **${formatTime(timeLeft)}**.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        EconomyManager.setCooldown(guildId, userId, 'last_crime', now);

        // Phase 10 & 7: Success Chance overrides 
        let successChance = crimeCfg.baseSuccessChance;
        let buffMsg = '';

        if (BuffManager.hasActiveBuff(guildId, userId, 'buff_crime_expires')) {
            const boostItem = config.shop.categories.find(c => c.id === 'boosts').items.find(i => i.buffType === 'buff_crime_expires');
            if (boostItem) {
                successChance += boostItem.effectAmount;
                buffMsg += `\n*🐱‍💻 Hacker Tool Active (+${boostItem.effectAmount * 100}%)*`;
            }
        }

        const isSuccess = Math.random() < successChance;

        if (isSuccess) {
            const payout = Math.floor(Math.random() * (crimeCfg.maxPayout - crimeCfg.minPayout + 1)) + crimeCfg.minPayout;
            const scenario = crimeCfg.successScenarios[Math.floor(Math.random() * crimeCfg.successScenarios.length)];

            EconomyManager.addWallet(guildId, userId, payout);
            StatsManager.addWin(guildId, userId, 'crime', payout);

            const xpAmount = Math.floor(Math.random() * (config.xpSystem.rewards.crime.max - config.xpSystem.rewards.crime.min + 1)) + config.xpSystem.rewards.crime.min;
            const leveledUp = XPManager.addXp(guildId, userId, xpAmount);
            if (leveledUp) buffMsg += `\n**🆙 You leveled up!**`;

            const embed = new EmbedBuilder()
                .setColor(config.successColor)
                .setTitle(`${config.casinoEmoji} Crime Successful!`)
                .setDescription(`${scenario}\n\nYou got away with **$${payout.toLocaleString()}**!${buffMsg}`)
                .setFooter({ text: config.footerBranding ? `${config.footerBranding} | New Wallet: $${(user.balance + payout).toLocaleString()}` : `New Wallet: $${(user.balance + payout).toLocaleString()}` });

            await interaction.reply({ embeds: [embed] });
        } else {
            const scenario = crimeCfg.failScenarios[Math.floor(Math.random() * crimeCfg.failScenarios.length)];
            const oldBalance = user.balance;

            // Phase 7: Fine reduction perk
            let fineMulti = 1.0;
            const reduction = XPManager.getPerkModifier(guildId, userId, 'crimeReductionPerLevel');
            if (reduction > 0) {
                fineMulti = Math.max(0, 1.0 - reduction);
                buffMsg += `\n*✨ Level Perk: Fine naturally reduced by ${(reduction * 100).toFixed(1)}%*`;
            }

            const fineAmount = Math.floor(oldBalance * fineMulti);
            EconomyManager.setWallet(guildId, userId, oldBalance - fineAmount);
            StatsManager.addLoss(guildId, userId, 'crime', fineAmount);

            let bankruptMsg = '';
            if (oldBalance - fineAmount <= 0) {
                bankruptMsg = `\nYou went totally bankrupt!`;
                // Trigger secret achievement
                const stats = StatsManager.getStats(guildId, userId);
                if (!AchievementManager.getUnlocked(guildId, userId).includes('lose_everything')) {
                    const ach = config.achievements.find(a => a.id === 'lose_everything');
                    AchievementManager.unlock(guildId, userId, ach, interaction);
                }
            }

            const embed = new EmbedBuilder()
                .setColor(config.errorColor)
                .setTitle('🚨 Busted!')
                .setDescription(`${scenario}\n\nYou were heavily fined and lost **$${fineAmount.toLocaleString()}**!${buffMsg}${bankruptMsg}`)
                .setFooter({ text: config.footerBranding ? `${config.footerBranding} | New Wallet: $${(oldBalance - fineAmount).toLocaleString()}` : `New Wallet: $${(oldBalance - fineAmount).toLocaleString()}` });

            await interaction.reply({ embeds: [embed] });
        }

        AchievementManager.checkAll(guildId, userId, interaction);
    }
};
