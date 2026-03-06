const db = require('../database/db');
const EconomyManager = require('./EconomyManager');
const config = require('../../config.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ShopManager {
    /**
     * Get all shop items across all categories
     * @returns {Array} Array of item objects
     */
    static getItems() {
        let allItems = [];
        for (const cat of config.shop.categories) {
            allItems = allItems.concat(cat.items);
        }
        return allItems;
    }

    /**
     * Get a specific item by its ID
     * @param {string} itemId 
     * @returns {Object|undefined}
     */
    static getItem(itemId) {
        return this.getItems().find(item => item.id.toLowerCase() === itemId.toLowerCase());
    }

    /**
     * Generate a localized shop embed for a specific page
     * @param {number} page - 0-indexed page number
     * @returns {Object} EmbedBuilder and ActionRowBuilder row
     */
    generateShopPage(page = 0) {
        const totalPages = Math.ceil(this.items.length / this.itemsPerPage) || 1;

        // Safety bounds
        if (page < 0) page = 0;
        if (page >= totalPages) page = totalPages - 1;

        const startIdx = page * this.itemsPerPage;
        const pageItems = this.items.slice(startIdx, startIdx + this.itemsPerPage);

        const embed = new EmbedBuilder()
            .setTitle('🛒 Casino Role Shop')
            .setDescription(`Purchase custom roles using your casino balance!\nUse \`${config.prefix}buy <tag>\` to purchase.`)
            .setColor(0xFFD700)
            .setFooter({ text: `Page ${page + 1}/${totalPages}` });

        if (pageItems.length === 0) {
            embed.addFields({ name: 'Empty', value: 'There are no items in the shop yet.' });
        } else {
            pageItems.forEach(item => {
                embed.addFields({
                    name: `[${item.id}] ${item.name} - $${item.price.toLocaleString()}`,
                    value: item.description
                });
            });
        }

        // Generate Buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`shop_prev_${page}`)
                .setEmoji('⬅️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`shop_next_${page}`)
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page >= totalPages - 1),
            new ButtonBuilder()
                .setCustomId('shop_close')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

        return { embed, row };
    }
}

module.exports = new ShopManager();
