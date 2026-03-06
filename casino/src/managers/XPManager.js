const db = require('../database/db');
const EconomyManager = require('./EconomyManager');
const config = require('../../config.js');

class XPManager {
    /**
     * Get the XP needed for the user to hit the NEXT level based on their CURRENT level
     * Formula: baseRequirement * (currentLevel ^ scalingFactor)
     * @param {number} currentLevel 
     */
    static getXpNeeded(currentLevel) {
        const { baseRequirement, scalingFactor } = config.xpSystem;
        return Math.floor(baseRequirement * Math.pow(currentLevel, scalingFactor));
    }

    /**
     * Get user's current level and xp
     * @param {string} guildId 
     * @param {string} userId 
     */
    static getLevelData(guildId, userId) {
        EconomyManager.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        return db.prepare('SELECT level, xp FROM users WHERE id = ?').get(id);
    }

    /**
     * Get a scaling perk modifier based on user's current level
     * @param {string} guildId 
     * @param {string} userId 
     * @param {string} perkKey matches config.xpSystem.perks (e.g., 'crimeReductionPerLevel')
     */
    static getPerkModifier(guildId, userId, perkKey) {
        const data = this.getLevelData(guildId, userId);
        // Base level is 1, so perks apply starting at level 2 (level - 1)
        const levelsEarned = Math.max(0, data.level - 1);
        const factor = config.xpSystem.perks[perkKey] || 0;
        return levelsEarned * factor;
    }

    /**
     * Add XP, handle level ups silently
     * @param {string} guildId 
     * @param {string} userId 
     * @param {number} amount 
     * @returns {boolean} true if they leveled up this transaction
     */
    static addXp(guildId, userId, amount) {
        EconomyManager.ensureUser(guildId, userId);
        let leveledUp = false;
        const id = `${guildId}-${userId}`;

        const data = db.prepare('SELECT level, xp FROM users WHERE id = ?').get(id);
        let currentLevel = data.level;
        let currentXp = data.xp + amount;

        while (true) {
            const needed = this.getXpNeeded(currentLevel);
            if (currentXp >= needed) {
                currentXp -= needed;
                currentLevel++;
                leveledUp = true;
            } else {
                break;
            }
        }

        db.prepare('UPDATE users SET level = ?, xp = ? WHERE id = ?').run(currentLevel, currentXp, id);
        return leveledUp;
    }
}

module.exports = XPManager;
