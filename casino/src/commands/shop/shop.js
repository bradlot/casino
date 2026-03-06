const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View the categorized casino shop.'),
    async execute(interaction) {
        let currentCatIndex = 0;
        const categories = config.shop.categories;

        const generateEmbed = (catIndex) => {
            const cat = categories[catIndex];

            let desc = `*${cat.description}*\n\n`;
            if (cat.items.length === 0) desc += "There are no items in this category right now.";

            for (const item of cat.items) {
                desc += `**${item.name}** (\`/buy ${item.id}\`)\n`;
                desc += `> Price: **$${item.price.toLocaleString()}**\n`;
                desc += `> ${item.description}\n\n`;
            }

            return new EmbedBuilder()
                .setColor(config.themeColor)
                .setTitle(`🛒 Casino Shop - ${cat.name}`)
                .setDescription(desc)
                .setFooter({ text: config.footerBranding ? `Category ${catIndex + 1} of ${categories.length} | ${config.footerBranding}` : `Category ${catIndex + 1} of ${categories.length}` });
        };

        const getRow = (catIndex) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('shop_prev')
                    .setLabel('◀ Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(catIndex === 0),
                new ButtonBuilder()
                    .setCustomId('shop_next')
                    .setLabel('Next ▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(catIndex === categories.length - 1),
                new ButtonBuilder()
                    .setCustomId('shop_close')
                    .setLabel('Close')
                    .setStyle(ButtonStyle.Danger)
            );
        };

        const shopMsg = await interaction.reply({
            embeds: [generateEmbed(currentCatIndex)],
            components: [getRow(currentCatIndex)],
            fetchReply: true
        });

        const collector = shopMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000,
            filter: i => i.user.id === interaction.user.id
        });

        collector.on('collect', async i => {
            if (i.customId === 'shop_close') {
                collector.stop('closed');
                return i.update({ components: [] });
            }

            if (i.customId === 'shop_prev') {
                currentCatIndex--;
            } else if (i.customId === 'shop_next') {
                currentCatIndex++;
            }

            if (currentCatIndex < 0) currentCatIndex = 0;
            if (currentCatIndex >= categories.length) currentCatIndex = categories.length - 1;

            await i.update({ embeds: [generateEmbed(currentCatIndex)], components: [getRow(currentCatIndex)] });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => { });
        });
    }
};
