const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EconomyManager = require('../../managers/EconomyManager');
const ShopManager = require('../../managers/ShopManager');
const BuffManager = require('../../managers/BuffManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy an item or buff from the shop.')
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('The tag of the item you want to buy')
                .setRequired(true)),
    async execute(interaction) {
        const tag = interaction.options.getString('tag').toLowerCase();
        const item = ShopManager.getItem(tag);

        if (!item) {
            return interaction.reply({ content: `Item with tag \`${tag}\` not found in the shop. Use \`/shop\` to see available items.`, ephemeral: true });
        }

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const user = EconomyManager.getUser(guildId, userId);

        if (user.balance < item.price) {
            const embed = new EmbedBuilder()
                .setColor(config.errorColor)
                .setTitle('❌ Insufficient Funds')
                .setDescription(`<@${userId}>, you don't have enough money in your wallet to buy **${item.name}**.\nPrice: **$${item.price.toLocaleString()}**\nWallet: **$${user.balance.toLocaleString()}**`);
            return interaction.reply({ embeds: [embed] });
        }

        // Processing based on Item properties 
        // 1. Role System
        if (item.roleId) {
            const role = interaction.guild.roles.cache.get(item.roleId);
            if (!role) {
                return interaction.reply({ content: `The role for this item does not exist on the server. Please contact an administrator.`, ephemeral: true });
            }

            const member = interaction.member || await interaction.guild.members.fetch(userId);
            if (member.roles.cache.has(role.id)) {
                return interaction.reply({ content: `You already have the **${item.name}** role!`, ephemeral: true });
            }

            try {
                await member.roles.add(role);
            } catch (error) {
                console.error('Error adding role:', error);
                return interaction.reply({ content: `Failed to assign role. The bot likely doesn't have required permissions.`, ephemeral: true });
            }
        }

        // 2. Buff System
        if (item.buffType) {
            const limits = item.stackableLimit || 0;
            const success = BuffManager.addBuff(guildId, userId, item.buffType, item.durationHours, limits);
            if (!success) {
                return interaction.reply({ content: `You have hit the maximum stackable limit for this buff (${limits} hours)! Wait for it to wear off.`, ephemeral: true });
            }
        }

        // Deduct Cash Flow
        EconomyManager.removeWallet(guildId, userId, item.price);

        let finalNote = '';
        if (item.buffType) {
            finalNote = `\n↪️ *Buff applied for ${item.durationHours} hours.*`;
        }

        const embed = new EmbedBuilder()
            .setColor(config.successColor)
            .setTitle('🎉 Purchase Successful!')
            .setDescription(`You successfully purchased **${item.name}** for **$${item.price.toLocaleString()}**!${finalNote}`)
            .setFooter({ text: config.footerBranding ? `${config.footerBranding} | New Wallet: $${(user.balance - item.price).toLocaleString()}` : `New Wallet: $${(user.balance - item.price).toLocaleString()}` });

        return interaction.reply({ embeds: [embed] });
    }
};
