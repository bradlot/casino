const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LeaderboardManager = require('../../managers/LeaderboardManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the casino leaderboards.')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The leaderboard category')
                .setRequired(false)
                .addChoices(
                    { name: 'Net Worth', value: 'networth' },
                    { name: 'Blackjack Wins', value: 'wins' },
                    { name: 'Total Wagered', value: 'wagered' },
                    { name: 'Crime Success Rate', value: 'crime' }
                )),
    async execute(interaction) {
        const categoryMap = {
            'networth': { col: 'net_worth', title: '💰 Richest Players (Net Worth)' },
            'wins': { col: 'bj_wins', title: '🃏 Top Blackjack Winners' },
            'wagered': { col: 'wagered', title: '🎲 Biggest Gamblers' },
            'crime': { col: 'crime_success', title: '🦹 Best Criminals (Win Rate %)' }
        };

        const cat = interaction.options.getString('category') || 'networth';

        const mapping = categoryMap[cat];
        const rows = LeaderboardManager.getTop(interaction.guildId, mapping.col, 10);

        if (rows.length === 0) {
            return interaction.reply({ content: 'No data to display.', ephemeral: true });
        }

        let description = '';
        rows.forEach((row, index) => {
            let val = row.score.toLocaleString();
            if (cat === 'crime') val = `${row.score.toFixed(1)}%`;
            if (cat === 'networth' || cat === 'wagered') val = `$${val}`;
            description += `**${index + 1}.** <@${row.id}> - ${val}\n`;
        });

        const userRank = LeaderboardManager.getUserRank(interaction.guildId, interaction.user.id, mapping.col);

        const embed = new EmbedBuilder()
            .setColor(config.themeColor)
            .setTitle(mapping.title)
            .setDescription(description)
            .setFooter({ text: config.footerBranding ? `Your Rank: ${userRank} | ${config.footerBranding}` : `Your Rank: ${userRank}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
