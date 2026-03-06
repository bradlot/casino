class GameManager {
    constructor() {
        // Map of id -> current active game type (e.g. 'blackjack')
        this.activeGames = new Map();
    }

    /**
     * Check if a user is currently in a game
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId - Discord User ID
     * @returns {string|null} The name of the active game, or null if none
     */
    hasActiveGame(guildId, userId) {
        const id = `${guildId}-${userId}`;
        return this.activeGames.get(id) || null;
    }

    /**
     * Start a new game session for a user
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId - Discord User ID
     * @param {string} gameName - Name of the game (e.g. 'blackjack')
     * @returns {boolean} True if successfully started, false if already in a game
     */
    startGame(guildId, userId, gameName) {
        const id = `${guildId}-${userId}`;
        if (this.hasActiveGame(guildId, userId)) return false;
        this.activeGames.set(id, gameName);
        return true;
    }

    /**
     * End a user's active game session
     * @param {string} guildId - Discord Guild ID
     * @param {string} userId - Discord User ID
     */
    endGame(guildId, userId) {
        const id = `${guildId}-${userId}`;
        this.activeGames.delete(id);
    }
}

// Export a singleton instance
module.exports = new GameManager();
