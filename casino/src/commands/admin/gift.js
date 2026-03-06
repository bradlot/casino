const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ShopManager = require('../../managers/ShopManager');
const BuffManager = require('../../managers/BuffManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gift')
        .setDescription('Give a user a shop item for free.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to gift the item to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('The shop item tag to gift')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('target');
        const tag = interaction.options.getString('tag').toLowerCase();

        const item = ShopManager.getItem(tag);

        if (!item) {
            return interaction.reply({ content: `Item with tag \`${tag}\` not found in config.`, ephemeral: true });
        }

        // Apply without deducting balance
        if (item.roleId) {
            const role = interaction.guild.roles.cache.get(item.roleId);
            if (!role) return interaction.reply({ content: 'Role ID invalid in config!', ephemeral: true });

            const member = interaction.guild.members.cache.get(targetUser.id) || await interaction.guild.members.fetch(targetUser.id);
            await member.roles.add(role).catch(() => { });
        }

        if (item.buffType) {
            BuffManager.addBuff(targetUser.id, item.buffType, item.durationHours, item.stackableLimit || 0);
        }

        const embed = new EmbedBuilder()
            .setColor(config.themeColor)
            .setTitle('🛡️ Admin Gift Distributed')
            .setDescription(`You forced the system to bypass economy requirements and instantly granted **${item.name}** to ${targetUser}.`);

        return interaction.reply({ embeds: [embed] });
    }
};
