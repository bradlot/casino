const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StatsManager = require('../../managers/StatsManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View detailed historical statistics for a user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to view stats for (optional)')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        if (targetUser.bot) {
            return interaction.reply({ content: "Bots do not have tracked stats.", ephemeral: true });
        }

        const stats = StatsManager.getStats(interaction.guildId, targetUser.id);

        let bjWinRate = 0;
        const totalBjGames = stats.bj_wins + stats.bj_losses;
        if (totalBjGames > 0) bjWinRate = (stats.bj_wins / totalBjGames) * 100;

        let crimeSuccessRate = 0;
        const totalCrimes = stats.crime_successes + stats.crime_fails;
        if (totalCrimes > 0) crimeSuccessRate = (stats.crime_successes / totalCrimes) * 100;

        let robSuccessRate = 0;
        const totalRobs = stats.rob_successes + stats.rob_fails;
        if (totalRobs > 0) robSuccessRate = (stats.rob_successes / totalRobs) * 100;

        const embed = new EmbedBuilder()
            .setColor(config.themeColor)
            .setAuthor({ name: `${targetUser.username}'s Casino Stats`, iconURL: targetUser.displayAvatarURL() })
            .addFields(
                { name: 'Total Earned', value: `$${stats.total_earned.toLocaleString()}`, inline: true },
                { name: 'Total Lost', value: `$${stats.total_lost.toLocaleString()}`, inline: true },
                { name: 'Total Gambled', value: `$${(stats.total_earned + stats.total_lost).toLocaleString()}`, inline: true },
                { name: 'Biggest Win', value: `$${stats.biggest_win.toLocaleString()}`, inline: false },
                { name: 'Biggest Loss', value: `$${stats.biggest_loss.toLocaleString()}`, inline: false },
                { name: '🃏 BJ Win Rate', value: `${bjWinRate.toFixed(1)}% (${stats.bj_wins}W / ${stats.bj_losses}L)`, inline: true },
                { name: '🦹 Crime Rate', value: `${crimeSuccessRate.toFixed(1)}% (${stats.crime_successes}W / ${stats.crime_fails}L)`, inline: true },
                { name: '🥷 Rob Rate', value: `${robSuccessRate.toFixed(1)}% (${stats.rob_successes}W / ${stats.rob_fails}L)`, inline: true }
            )
            .setTimestamp() // Replace empty footer to avoid discord API crash
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
