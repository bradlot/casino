const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete messages in this channel.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription(`The number of messages to delete (1-${config.admin.maxPurgeCount})`)
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(config.admin.maxPurgeCount)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const amount = interaction.options.getInteger('amount');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let deletedTotal = 0;
        let fetchParams = { limit: 100 };

        // Lock the channel
        const everyoneRole = interaction.guild.roles.everyone;
        try {
            await interaction.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false });
        } catch (e) {
            console.error('[Error] Locking channel:', e);
        }

        try {
            while (deletedTotal < amount) {
                const limit = Math.min(amount - deletedTotal, 100);

                // Fetch messages
                const messages = await interaction.channel.messages.fetch({ limit });

                // Break if channel has no more messages to fetch
                if (messages.size === 0) break;

                // Filter messages older than 14 days early to avoid bulkDelete blowing up
                const now = Date.now();
                const fourteenDays = 14 * 24 * 60 * 60 * 1000;
                const deletable = messages.filter(msg => (now - msg.createdTimestamp) < fourteenDays);

                if (deletable.size === 0) {
                    await interaction.channel.send({ content: `⚠️ Discord restricts bots from bulk-deleting messages older than 14 days. Stopped purging at ${deletedTotal} messages.` })
                        .then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
                    break;
                }

                await interaction.channel.bulkDelete(deletable, true);
                deletedTotal += deletable.size;

                // Add a micro-delay to avoid API rate limiting issues (429 Too Many Requests)
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            const embed = new EmbedBuilder()
                .setColor(config.successColor || 0x00FF00)
                .setTitle('🗑️ Purge Complete')
                .setDescription(`Successfully purged **${deletedTotal}** messages.`);

            await interaction.editReply({ embeds: [embed] });
            // Unlock the channel
            try {
                await interaction.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null });
            } catch (e) {
                console.error('[Error] Unlocking channel:', e);
            }

        } catch (error) {
            // Ensure channel is unlocked on error
            try {
                await interaction.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null });
            } catch (e) {
                console.error('[Error] Unlocking channel:', e);
            }
            if (error.code === 10062 || error.code === 40060) return; // Gracefully ignore duplicate instances racing to acknowledge

            console.error('[Error] Purging messages:', error);
            await interaction.editReply({ content: 'There was an error attempting to purge messages. You may have hit a rate limit.' }).catch(() => { });
        }
    }
};
