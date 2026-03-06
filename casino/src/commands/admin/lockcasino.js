const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockcasino')
        .setDescription('Toggle a global lock on the casino.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        global.isCasinoLocked = !global.isCasinoLocked;

        const embed = new EmbedBuilder()
            .setColor(global.isCasinoLocked ? config.errorColor : config.successColor)
            .setTitle('🛡️ Admin Override')
            .setDescription(`Global Casino Lock is now **${global.isCasinoLocked ? 'ACTIVE 🔒' : 'DISABLED 🔓'}**.\n\nPublic economy commands will ${global.isCasinoLocked ? 'be blocked' : 'now work'}.`);

        return interaction.reply({ embeds: [embed] });
    }
};
