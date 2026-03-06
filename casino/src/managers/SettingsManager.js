const db = require('../database/db');

class SettingsManager {
    /**
     * Retrieves all settings for a specific guild.
     * @param {string} guildId
     * @returns {Object} { casino_channel_id, bot_channel_id, admin_channel_id }
     */
    static getSettings(guildId) {
        const row = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
        if (!row) {
            return {
                casino_channel_id: null,
                bot_channel_id: null,
                admin_channel_id: null
            };
        }
        return row;
    }

    /**
     * Updates a specific channel setting for a guild.
     * @param {string} guildId 
     * @param {string} type 'casino', 'bot', or 'admin' 
     * @param {string|null} channelId The Discord channel ID, or null to clear it
     */
    static setChannel(guildId, type, channelId) {
        // Ensure row exists
        db.prepare('INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)').run(guildId);

        let column = '';
        if (type === 'casino') column = 'casino_channel_id';
        else if (type === 'bot') column = 'bot_channel_id';
        else if (type === 'admin') column = 'admin_channel_id';
        else return false;

        db.prepare(`UPDATE guild_settings SET ${column} = ? WHERE guild_id = ?`).run(channelId, guildId);
        return true;
    }
}

module.exports = SettingsManager;
