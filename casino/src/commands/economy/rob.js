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
        .setName('rob')
        .setDescription('Attempt to steal money from another user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to rob')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const targetUser = interaction.options.getUser('target');
        const robCfg = config.economy.rob;

        if (targetUser.id === userId) {
            return interaction.reply({ content: 'You cannot rob yourself.', ephemeral: true });
        }
        if (targetUser.bot) {
            return interaction.reply({ content: 'You cannot rob bots, they have infinite security systems.', ephemeral: true });
        }

        const user = EconomyManager.getUser(guildId, userId);
        const targetInfo = EconomyManager.getUser(guildId, targetUser.id);
        const now = Date.now();

        const COOLDOWN_MS = robCfg.cooldownHours * 60 * 60 * 1000;
        const timePassed = now - user.last_rob;
        if (timePassed < COOLDOWN_MS) {
            const timeLeft = COOLDOWN_MS - timePassed;
            const embed = new EmbedBuilder()
                .setColor(config.errorColor)
                .setTitle('⏳ Lay Low')
                .setDescription(`You need to lay low before attempting another robbery.\nTry again in **${formatTime(timeLeft)}**.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (targetInfo.balance <= 0) {
            return interaction.reply({ content: 'That user is completely broke in their wallet. Have some mercy.', ephemeral: true });
        }

        EconomyManager.setCooldown(guildId, userId, 'last_rob', now);

        const isSuccess = Math.random() < robCfg.baseSuccessChance;
        let buffMsg = '';

        if (isSuccess) {
            // Base cap is 0.25 (25%)
            let maxPercentSteal = robCfg.baseStealCap;

            // Phase 7: Attacker XP Perk increases cap
            const perkBoost = XPManager.getPerkModifier(guildId, userId, 'robCapIncreasePerLevel');
            if (perkBoost > 0) {
                maxPercentSteal += perkBoost;
                buffMsg += `\n*✨ Level Perk: Rob cap increased by ${(perkBoost * 100).toFixed(1)}%*`;
            }

            let percentSteal = (Math.random() * (maxPercentSteal - robCfg.minStealPercent)) + robCfg.minStealPercent;

            // Phase 10: Target Protection Buff
            const hasProtection = BuffManager.hasActiveBuff(guildId, targetUser.id, 'buff_rob_protect_expires');
            if (hasProtection) {
                const item = config.shop.categories.find(c => c.id === 'protection').items.find(i => i.buffType === 'buff_rob_protect_expires');
                if (item) {
                    percentSteal *= item.effectAmount; // usually cuts in half
                    buffMsg += `\n*🛡️ Target Padlock Active: Reduced stolen amount!*`;
                }
            }

            const amountStolen = Math.floor(targetInfo.balance * percentSteal);

            if (amountStolen <= 0) {
                return interaction.reply({ content: "You successfully robbed them, but they barely had any pocket change.", ephemeral: true });
            }

            const successRemove = EconomyManager.removeWallet(guildId, targetUser.id, amountStolen);
            if (!successRemove) {
                return interaction.reply({ content: "Something went wrong. Let's act like this didn't happen.", ephemeral: true });
            }

            EconomyManager.addWallet(guildId, userId, amountStolen);
            StatsManager.addWin(guildId, userId, 'rob', amountStolen);

            const xpAmount = Math.floor(Math.random() * (config.xpSystem.rewards.rob_success.max - config.xpSystem.rewards.rob_success.min + 1)) + config.xpSystem.rewards.rob_success.min;
            const leveledUp = XPManager.addXp(guildId, userId, xpAmount);
            if (leveledUp) buffMsg += `\n**🆙 You leveled up!**`;

            const embed = new EmbedBuilder()
                .setColor(config.successColor)
                .setTitle(`${config.casinoEmoji} The Perfect Heist!`)
                .setDescription(`You successfully sneaked up behind ${targetUser.username} and stole **$${amountStolen.toLocaleString()}**!${buffMsg}`)
                .setFooter({ text: config.footerBranding ? `${config.footerBranding} | New Wallet: $${(user.balance + amountStolen).toLocaleString()}` : `New Wallet: $${(user.balance + amountStolen).toLocaleString()}` });

            await interaction.reply({ content: `<@${targetUser.id}>`, embeds: [embed] });
        } else {
            const scenario = robCfg.failScenarios[Math.floor(Math.random() * robCfg.failScenarios.length)];
            const oldBalance = user.balance;

            EconomyManager.setWallet(guildId, userId, 0);
            StatsManager.addLoss(guildId, userId, 'rob', oldBalance);

            let bankruptMsg = '';
            if (oldBalance > 0) {
                bankruptMsg = `\nYou went totally bankrupt!`;
                const stats = StatsManager.getStats(guildId, userId);
                if (!AchievementManager.getUnlocked(guildId, userId).includes('lose_everything')) {
                    const ach = config.achievements.find(a => a.id === 'lose_everything');
                    AchievementManager.unlock(guildId, userId, ach, interaction);
                }
            }

            const embed = new EmbedBuilder()
                .setColor(config.errorColor)
                .setTitle('🚨 Busted!')
                .setDescription(`You approached ${targetUser.username}, but... ${scenario}\n\nYou were heavily fined and lost **$${oldBalance.toLocaleString()}**!${bankruptMsg}`)
                .setFooter({ text: config.footerBranding ? `${config.footerBranding} | New Wallet: $0` : `New Wallet: $0` });

            await interaction.reply({ embeds: [embed] });
        }

        AchievementManager.checkAll(guildId, userId, interaction);
    }
};
