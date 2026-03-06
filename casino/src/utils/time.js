/**
 * Format milliseconds into a readable string (e.g. 1h 30m 15s)
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted string
 */
const formatTime = (ms) => {
    if (ms <= 0) return '0s';

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ');
};

module.exports = { formatTime };
