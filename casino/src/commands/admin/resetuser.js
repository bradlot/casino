const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../database/db');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetuser')
        .setDescription('Completely wipe a user\'s account data.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to reset')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('target');

        // Extremely destructive, delete from both users and achievements
        db.prepare('DELETE FROM users WHERE id = ?').run(targetUser.id);
        db.prepare('DELETE FROM user_achievements WHERE user_id = ?').run(targetUser.id);

        const embed = new EmbedBuilder()
            .setColor(config.errorColor)
            .setTitle('🛡️ Admin Warning: Database Write')
            .setDescription(`Successfully purged **all** database records for ${targetUser}. Their account has been factory reset.`);

        return interaction.reply({ embeds: [embed] });
    }
};
