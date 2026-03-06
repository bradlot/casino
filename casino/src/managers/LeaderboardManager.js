const db = require('../database/db');
const EconomyManager = require('./EconomyManager');

class LeaderboardManager {
    /**
     * Fetch top users by a specific column view.
     * Optimized using SQLite indices.
     * @param {string} guildId Guild ID
     * @param {string} column Column or View column name ('net_worth', 'bj_wins', 'wagered', 'crime_successes')
     * @param {number} limit limit rows
     * @param {boolean} requireMinimum For things like crime_successes or win rates where 1 attempt is 100%.
     */
    static getTop(guildId, column, limit = 10, requireMinimum = false) {
        let query;
        let prefix = `${guildId}-%`;

        switch (column) {
            case 'net_worth':
                query = `SELECT id, net_worth as score FROM v_net_worth WHERE id LIKE ? ORDER BY score DESC LIMIT ?`;
                break;
            case 'bj_wins':
                query = `SELECT id, bj_wins as score FROM users WHERE id LIKE ? ORDER BY score DESC LIMIT ?`;
                break;
            case 'wagered':
                query = `SELECT id, wagered as score FROM users WHERE id LIKE ? ORDER BY score DESC LIMIT ?`;
                break;
            case 'crime_success':
                // For rate, it's (successes * 1.0 / (successes + fails))
                query = `
                    SELECT id, 
                    CAST(crime_successes AS FLOAT) / (crime_successes + crime_fails) * 100 as score 
                    FROM users 
                    WHERE (crime_successes + crime_fails) >= 10 AND id LIKE ?
                    ORDER BY score DESC LIMIT ?
                `;
                break;
            default:
                throw new Error('Invalid leaderboard column');
        }

        const results = db.prepare(query).all(prefix, limit);
        return results.map(r => ({ ...r, id: r.id.split('-')[1] }));
    }

    /**
     * Gets absolute rank for an invoking user in a category.
     */
    static getUserRank(guildId, userId, column) {
        let id = `${guildId}-${userId}`;
        let query;
        let prefix = `${guildId}-%`;

        switch (column) {
            case 'net_worth':
                query = `SELECT COUNT(*) + 1 as rank FROM v_net_worth WHERE net_worth > (SELECT net_worth FROM v_net_worth WHERE id = ?) AND id LIKE ?`;
                break;
            case 'bj_wins':
                query = `SELECT COUNT(*) + 1 as rank FROM users WHERE bj_wins > (SELECT bj_wins FROM users WHERE id = ?) AND id LIKE ?`;
                break;
            case 'wagered':
                query = `SELECT COUNT(*) + 1 as rank FROM users WHERE wagered > (SELECT wagered FROM users WHERE id = ?) AND id LIKE ?`;
                break;
            case 'crime_success':
                query = `
                    SELECT COUNT(*) + 1 as rank 
                    FROM users 
                    WHERE ((CAST(crime_successes AS FLOAT) / (crime_successes + crime_fails)) > 
                           (SELECT CAST(crime_successes AS FLOAT) / (crime_successes + crime_fails) FROM users WHERE id = ?))
                    AND (crime_successes + crime_fails) >= 10 AND id LIKE ?
                `;
                break;
            default:
                throw new Error('Invalid leaderboard column rank fetch');
        }

        try {
            const result = db.prepare(query).get(id, prefix);
            return result ? result.rank : 'Unranked';
        } catch {
            return 'Unranked';
        }
    }
}

module.exports = LeaderboardManager;
