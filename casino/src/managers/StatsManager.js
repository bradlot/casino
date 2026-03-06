const db = require('../database/db');
const EconomyManager = require('./EconomyManager');

class StatsManager {
    static getStats(guildId, userId) {
        EconomyManager.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        return db.prepare('SELECT total_earned, total_lost, bj_wins, bj_losses, bj_pushes, crime_successes, crime_fails, rob_successes, rob_fails, biggest_win, biggest_loss FROM users WHERE id = ?').get(id);
    }

    /**
     * Add a win to a specific game, updating biggest_win and total_earned
     * @param {string} guildId 
     * @param {string} userId 
     * @param {string} game (bj, crime, rob)
     * @param {number} amount 
     */
    static addWin(guildId, userId, game, amount) {
        EconomyManager.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        const validGames = ['bj', 'crime', 'rob'];
        if (!validGames.includes(game)) throw new Error('Invalid game stat tracker');

        if (game === 'bj') {
            db.prepare(`UPDATE users SET bj_wins = bj_wins + 1 WHERE id = ?`).run(id);
        } else {
            db.prepare(`UPDATE users SET ${game}_successes = ${game}_successes + 1 WHERE id = ?`).run(id);
        }

        const currentOptions = this.getStats(guildId, userId);
        let updateQuery = 'UPDATE users SET total_earned = total_earned + ?';
        let params = [amount];

        if (amount > currentOptions.biggest_win) {
            updateQuery += ', biggest_win = ?';
            params.push(amount);
        }

        updateQuery += ' WHERE id = ?';
        params.push(id);

        db.prepare(updateQuery).run(...params);
    }

    /**
     * Add a loss to a specific game, updating biggest_loss and total_lost
     * @param {string} guildId 
     * @param {string} userId 
     * @param {string} game 
     * @param {number} amount 
     */
    static addLoss(guildId, userId, game, amount) {
        EconomyManager.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        const validGames = ['bj', 'crime', 'rob'];
        if (!validGames.includes(game)) throw new Error('Invalid game stat tracker');

        if (game === 'bj') {
            db.prepare(`UPDATE users SET bj_losses = bj_losses + 1 WHERE id = ?`).run(id);
        } else {
            db.prepare(`UPDATE users SET ${game}_fails = ${game}_fails + 1 WHERE id = ?`).run(id);
        }

        const currentOptions = this.getStats(guildId, userId);
        let updateQuery = 'UPDATE users SET total_lost = total_lost + ?';
        let params = [amount];

        if (amount > currentOptions.biggest_loss) {
            updateQuery += ', biggest_loss = ?';
            params.push(amount);
        }

        updateQuery += ' WHERE id = ?';
        params.push(id);

        db.prepare(updateQuery).run(...params);
    }

    static addPush(guildId, userId, game) {
        if (game !== 'bj') return;
        EconomyManager.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        db.prepare('UPDATE users SET bj_pushes = bj_pushes + 1 WHERE id = ?').run(id);
    }
}

module.exports = StatsManager;
