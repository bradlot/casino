const db = require('../database/db');

class EconomyManager {
    /**
     * Ensure a user exists in the database
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId - Discord User ID
     */
    static ensureUser(guildId, userId) {
        const id = `${guildId}-${userId}`;
        const stmt = db.prepare('SELECT id FROM users WHERE id = ?');
        const user = stmt.get(id);
        if (!user) {
            db.prepare('INSERT INTO users (id) VALUES (?)').run(id);
        }
    }

    /**
     * Get user profile
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId - Discord User ID
     * @returns {Object} User database row
     */
    static getUser(guildId, userId) {
        this.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    }

    /**
     * Add money to user's wallet (balance)
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId - Discord User ID
     * @param {number} amount - Amount to add
     */
    static addWallet(guildId, userId, amount) {
        this.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, id);
    }

    /**
     * Remove money from user's wallet (balance)
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId - Discord User ID
     * @param {number} amount - Amount to remove
     * @returns {boolean} True if successful, false if insufficient funds
     */
    static removeWallet(guildId, userId, amount) {
        this.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        const user = this.getUser(guildId, userId);
        if (user.balance < amount) return false;

        db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, id);
        return true;
    }

    /**
     * Set a user's wallet exactly
     */
    static setWallet(guildId, userId, amount) {
        this.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(amount, id);
    }

    /**
     * Deposit into bank (moves from balance -> bank)
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId 
     * @param {number} amount - pass Infinity or 'all' logic inside commands, just exact amount here 
     */
    static deposit(guildId, userId, amount) {
        this.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        const user = this.getUser(guildId, userId);
        if (user.balance < amount) return false;

        db.prepare('UPDATE users SET balance = balance - ?, bank = bank + ? WHERE id = ?').run(amount, amount, id);
        return true;
    }

    /**
     * Withdraw from bank (moves from bank -> balance)
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId 
     * @param {number} amount 
     */
    static withdraw(guildId, userId, amount) {
        this.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        const user = this.getUser(guildId, userId);
        if (user.bank < amount) return false;

        db.prepare('UPDATE users SET bank = bank - ?, balance = balance + ? WHERE id = ?').run(amount, amount, id);
        return true;
    }

    /**
     * Update wagered and won stats
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId - Discord User ID
     * @param {number} wagered - Amount wagered
     * @param {number} won - Amount won
     */
    static updateStats(guildId, userId, wagered, won) {
        this.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        db.prepare('UPDATE users SET wagered = wagered + ?, won = won + ? WHERE id = ?').run(wagered, won, id);
    }

    /**
     * Set a cooldown for a command
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId - Discord User ID
     * @param {string} column - DB column name (payday_last, last_work, last_crime, last_rob)
     * @param {number} timestamp - Unix timestamp in ms
     */
    static setCooldown(guildId, userId, column, timestamp = Date.now()) {
        this.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        // We use string concatenation for column names carefully since it's hardcoded columns.
        const validColumns = ['payday_last', 'last_work', 'last_crime', 'last_rob'];
        if (!validColumns.includes(column)) throw new Error('Invalid cooldown column');

        db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(timestamp, id);
    }

    /**
     * Increment the total amount of times a user has worked
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId 
     */
    static incrementWorkCount(guildId, userId) {
        this.ensureUser(guildId, userId);
        const id = `${guildId}-${userId}`;
        db.prepare('UPDATE users SET work_count = work_count + 1 WHERE id = ?').run(id);
    }
}

module.exports = EconomyManager;
