const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AchievementManager = require('../../managers/AchievementManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('View your unlocked and pending achievements.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to view achievements for (optional)')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        if (targetUser.bot) {
            return interaction.reply({ content: "Bots do not have achievements.", ephemeral: true });
        }

        const unlockedIds = AchievementManager.getUnlocked(interaction.guildId, targetUser.id);
        const stats = AchievementManager.getUserTrackerStats(interaction.guildId, targetUser.id);

        let completedLists = [];
        let pendingLists = [];

        for (const ach of config.achievements) {
            if (unlockedIds.includes(ach.id)) {
                completedLists.push(`✅ **${ach.name}**\n*${ach.description}*`);
            } else {
                if (ach.isHidden) {
                    pendingLists.push(`🔒 **???**\n*This achievement is a secret.*`);
                    continue;
                }

                const currentAmt = stats[ach.conditionKey] || 0;
                let cFriendly = currentAmt;
                let tFriendly = ach.targetAmount;
                if (ach.targetAmount >= 1000) {
                    cFriendly = currentAmt.toLocaleString();
                    tFriendly = ach.targetAmount.toLocaleString();
                }

                pendingLists.push(`⬛ **${ach.name}**\n*${ach.description}* \n↪️ Progress: **${cFriendly}/${tFriendly}**\n↪️ Reward: **$${ach.reward.toLocaleString()}**`);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(config.themeColor)
            .setAuthor({ name: `${targetUser.username}'s Achievements`, iconURL: targetUser.displayAvatarURL() })
            .addFields(
                { name: '🌟 Completed', value: completedLists.length > 0 ? completedLists.join('\n\n') : 'None yet.' },
                { name: '🔒 Locked', value: pendingLists.length > 0 ? pendingLists.join('\n\n') : 'All achievements unlocked!' }
            )
            .setTimestamp() // Replace empty footer to avoid discord API crash
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
