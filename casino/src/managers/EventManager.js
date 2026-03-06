const config = require('../../config.js');
const db = require('../database/db.js');

class EventManager {
    /**
     * Start an event and save to database.
     * @param {string} eventId 
     * @param {number} startMs 
     * @param {number} endMs 
     * @returns {boolean} Was event started successfully (true) or did event not exist in config (false)
     */
    static startEvent(eventId, startMs, endMs) {
        const eventConfig = config.events.find(e => e.id === eventId);
        if (!eventConfig) return false;

        db.prepare(`
            INSERT INTO active_events (id, start_time, end_time) 
            VALUES (@id, @start, @end)
            ON CONFLICT(id) DO UPDATE SET start_time=@start, end_time=@end
        `).run({
            id: eventId,
            start: startMs,
            end: endMs
        });

        return true;
    }

    /**
     * Ends an event by deleting it from the active database.
     * @param {string} eventId 
     * @returns {boolean} Was event stopped successfully (true) or was it not running (false)
     */
    static stopEvent(eventId) {
        const result = db.prepare('DELETE FROM active_events WHERE id = ?').run(eventId);
        return result.changes > 0;
    }

    /**
     * Check if a specific time-based event is actively running.
     * @param {string} eventId 
     * @returns {boolean}
     */
    static isEventActive(eventId) {
        const row = db.prepare('SELECT start_time, end_time FROM active_events WHERE id = ?').get(eventId);
        if (!row) return false;

        const now = Date.now();
        if (now >= row.start_time && now <= row.end_time) {
            return true;
        }

        // Auto-cleanup if expired
        if (now > row.end_time) {
            this.stopEvent(eventId);
        }

        return false;
    }

    /**
     * Retrieve multiplier for active event. Returns 1.0 if not active.
     */
    static getEventMultiplier(eventId) {
        if (!this.isEventActive(eventId)) return 1.0;

        const eventConfig = config.events.find(e => e.id === eventId);
        if (!eventConfig) return 1.0;

        return eventConfig.multiplier || 1.0;
    }
}

module.exports = EventManager;
