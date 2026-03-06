const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const XPManager = require('../../managers/XPManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check your current level, XP, and active perks.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to check the level of (optional)')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        if (targetUser.bot) {
            return interaction.reply({ content: "Bots do not gain XP.", ephemeral: true });
        }

        const { level, xp } = XPManager.getLevelData(interaction.guildId, targetUser.id);
        const xpNeeded = XPManager.getXpNeeded(level);

        // Progress Bar
        const percent = Math.floor((xp / xpNeeded) * 100);
        const filledBars = Math.floor(percent / 10);
        const emptyBars = 10 - filledBars;
        const progressBar = '🟩'.repeat(filledBars) + '⬛'.repeat(emptyBars);

        // Perks formatting
        const cReduct = (XPManager.getPerkModifier(interaction.guildId, targetUser.id, 'crimeReductionPerLevel') * 100).toFixed(1);
        const wMulti = (XPManager.getPerkModifier(interaction.guildId, targetUser.id, 'workMultiplierPerLevel') * 100).toFixed(1);
        const rCap = (XPManager.getPerkModifier(interaction.guildId, targetUser.id, 'robCapIncreasePerLevel') * 100).toFixed(1);

        let perksText = `No perks unlocked yet.`;
        if (level > 1) {
            perksText = `
**🦹 Crime Fines:** -${cReduct}%
**💼 Work Payout:** +${wMulti}%
**🥷 Rob Cap:** +${rCap}%
            `.trim();
        }

        const embed = new EmbedBuilder()
            .setColor(config.themeColor)
            .setAuthor({ name: `${targetUser.username}'s Level Profile`, iconURL: targetUser.displayAvatarURL() })
            .setDescription(`**Level ${level}**\n${progressBar} ${percent}% (${xp.toLocaleString()}/${xpNeeded.toLocaleString()} XP)\n\n**Active Perks**\n${perksText}`)
            .setTimestamp() // Replace empty footer to avoid discord API crash
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
