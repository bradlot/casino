const db = require('../database/db');
const EconomyManager = require('./EconomyManager');
const config = require('../../config.js');
const { EmbedBuilder } = require('discord.js');

class AchievementManager {
    /**
     * Get unlocked achievements for user
     * @param {string} guildId 
     * @param {string} userId 
     */
    static getUnlocked(guildId, userId) {
        const id = `${guildId}-${userId}`;
        const rows = db.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').all(id);
        return rows.map(r => r.achievement_id);
    }

    /**
     * Get users live stats to map against achievement targets
     */
    static getUserTrackerStats(guildId, userId) {
        EconomyManager.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
    }

    /**
     * Trigger background check on ALL achievements.
     * To be called silently during economy commands.
     * @param {string} guildId
     * @param {string} userId
     * @param {Object} message context to send congratulation messages
     */
    static async checkAll(guildId, userId, message) {
        const unlockedIds = this.getUnlocked(guildId, userId);
        const stats = this.getUserTrackerStats(guildId, userId);

        for (const ach of config.achievements) {
            if (unlockedIds.includes(ach.id)) continue;

            const currentAmount = stats[ach.conditionKey] || 0;

            if (currentAmount >= ach.targetAmount) {
                // Unlock!
                this.unlock(guildId, userId, ach, message);
            }
        }
    }

    /**
     * Handle strictly unlocking and rewarding an achievement. Avoids duplicate rewards via db constraint IGNORE
     */
    static unlock(guildId, userId, achievementObj, message) {
        const id = `${guildId}-${userId}`;
        const stmt = db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)');
        const result = stmt.run(id, achievementObj.id);

        // If changes === 1, the INSERT was successful, implying it wasn't a duplicate.
        if (result.changes === 1 && achievementObj.reward > 0) {
            EconomyManager.addWallet(guildId, userId, achievementObj.reward);

            // Output embed dynamically since this runs transparently behind commands
            if (message && message.channel) {
                const embed = new EmbedBuilder()
                    .setColor(0xFFFF00) // Golden achievement unlock code
                    .setTitle('🏆 Achievement Unlocked!')
                    .setDescription(`**${achievementObj.name}**\n${achievementObj.description}`)
                    .setFooter({ text: `Reward: $${achievementObj.reward.toLocaleString()}` });

                message.channel.send({ content: `<@${userId}>`, embeds: [embed], allowedMentions: { users: [userId] } }).catch(() => { });
            }
        }
    }
}

module.exports = AchievementManager;
