const db = require('../database/db');
const EconomyManager = require('./EconomyManager');

class BuffManager {
    /**
     * Verify if a buff is active based on timestamp
     * @param {string} guildId 
     * @param {string} userId 
     * @param {string} buffColumn Database column (e.g. 'buff_work_expires')
     * @returns {boolean}
     */
    static hasActiveBuff(guildId, userId, buffColumn) {
        EconomyManager.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        const user = db.prepare(`SELECT ${buffColumn} FROM users WHERE id = ?`).get(id);
        return user[buffColumn] > Date.now();
    }

    /**
     * Fetch active duration remaining
     */
    static getBuffTimeRemaining(guildId, userId, buffColumn) {
        EconomyManager.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        const user = db.prepare(`SELECT ${buffColumn} FROM users WHERE id = ?`).get(id);
        const diff = user[buffColumn] - Date.now();
        return diff > 0 ? diff : 0;
    }

    /**
     * Add time to a buff. Respects stackable limits.
     * @param {string} guildId
     * @param {string} userId
     * @param {string} buffColumn
     * @param {number} durationHours
     * @param {number} stackableLimitHours Max allowed limit. 0 means strictly resets duration (non-stackable).
     * @returns {boolean} true if successful, false if they hit the cap
     */
    static addBuff(guildId, userId, buffColumn, durationHours, stackableLimitHours = 0) {
        EconomyManager.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        const now = Date.now();
        const addedMs = durationHours * 60 * 60 * 1000;
        const capMs = stackableLimitHours * 60 * 60 * 1000;

        const user = db.prepare(`SELECT ${buffColumn} FROM users WHERE id = ?`).get(id);
        let currentExpiration = user[buffColumn] || 0;

        let newExpiration;
        if (currentExpiration > now) {
            // Buff already active
            if (stackableLimitHours <= 0) {
                newExpiration = now + addedMs; // Reset duration (do not add)
            } else {
                newExpiration = currentExpiration + addedMs;
            }
        } else {
            // Not active
            newExpiration = now + addedMs;
        }

        // Apply Cap if stackable Limit is > 0
        if (stackableLimitHours > 0) {
            const currentDurationLeft = Math.max(0, currentExpiration - now);
            if (currentDurationLeft >= capMs) {
                return false; // Already maxed out
            }
            if (newExpiration - now > capMs) {
                newExpiration = now + capMs; // Hard clamp to cap
            }
        }

        db.prepare(`UPDATE users SET ${buffColumn} = ? WHERE id = ?`).run(newExpiration, id);
        return true;
    }
}

module.exports = BuffManager;
