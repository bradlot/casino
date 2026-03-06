const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'casino.sqlite');
const db = new Database(dbPath, {
    // verbose: console.log 
});

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize Database Tables
const initDB = () => {
    // Guild Settings table (Phase 17)
    db.prepare(`
        CREATE TABLE IF NOT EXISTS guild_settings (
            guild_id TEXT PRIMARY KEY,
            casino_channel_id TEXT,
            bot_channel_id TEXT,
            admin_channel_id TEXT
        )
    `).run();

    // Users table for economy
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            balance INTEGER DEFAULT 0,
            wagered INTEGER DEFAULT 0,
            won INTEGER DEFAULT 0,
            payday_last INTEGER DEFAULT 0,
            last_work INTEGER DEFAULT 0,
            last_crime INTEGER DEFAULT 0,
            last_rob INTEGER DEFAULT 0
        )
    `).run();

    // Dynamically add columns for Phase 7 (XP) and Phase 8 (Stats) upgrades
    const newColumns = [
        { name: 'level', type: 'INTEGER DEFAULT 1' },
        { name: 'xp', type: 'INTEGER DEFAULT 0' },
        { name: 'total_earned', type: 'INTEGER DEFAULT 0' },
        { name: 'total_lost', type: 'INTEGER DEFAULT 0' },
        { name: 'bj_wins', type: 'INTEGER DEFAULT 0' },
        { name: 'bj_losses', type: 'INTEGER DEFAULT 0' },
        { name: 'bj_pushes', type: 'INTEGER DEFAULT 0' },
        { name: 'crime_successes', type: 'INTEGER DEFAULT 0' },
        { name: 'crime_fails', type: 'INTEGER DEFAULT 0' },
        { name: 'rob_successes', type: 'INTEGER DEFAULT 0' },
        { name: 'rob_fails', type: 'INTEGER DEFAULT 0' },
        { name: 'biggest_win', type: 'INTEGER DEFAULT 0' },
        { name: 'biggest_loss', type: 'INTEGER DEFAULT 0' },
        { name: 'bank', type: 'INTEGER DEFAULT 0' },
        { name: 'buff_work_expires', type: 'INTEGER DEFAULT 0' },
        { name: 'buff_crime_expires', type: 'INTEGER DEFAULT 0' },
        { name: 'buff_rob_protect_expires', type: 'INTEGER DEFAULT 0' },
        { name: 'work_count', type: 'INTEGER DEFAULT 0' }
    ];

    for (const col of newColumns) {
        try {
            db.prepare(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`).run();
        } catch (error) {
            // Column already exists, safe to ignore
        }
    }

    // Phase 12: Achievements Mapping Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS user_achievements (
            user_id TEXT,
            achievement_id TEXT,
            PRIMARY KEY (user_id, achievement_id)
        )
    `).run();

    // Phase 16: Active Events Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS active_events (
            id TEXT PRIMARY KEY,
            start_time INTEGER,
            end_time INTEGER
        )
    `).run();

    // Phase 11: Optimized Leaderboards Indexes
    try {
        db.prepare('CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance DESC)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_users_bank ON users(bank DESC)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_users_bj_wins ON users(bj_wins DESC)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_users_crime_success ON users(crime_successes DESC)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_users_wagered ON users(wagered DESC)').run();

        // Net worth view for leaderboards
        db.prepare('CREATE VIEW IF NOT EXISTS v_net_worth AS SELECT id, (balance + bank) AS net_worth FROM users').run();
    } catch (error) {
        console.error('[DB] Index/View creation error:', error);
    }

    console.log('[DB] Database tables initialized and upgraded.');
};

initDB();

module.exports = db;
