const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const EventManager = require('../../managers/EventManager');
const config = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Manage live time-based events.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('event_id')
                .setDescription('The ID of the event to manage')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g. 1h, 1d, 1mo)')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const eventIdRaw = interaction.options.getString('event_id');
        const durationStrRaw = interaction.options.getString('duration');

        // No args: list all valid event template IDs
        if (!eventIdRaw) {
            const eventList = config.events.map(e => `**${e.id}**: ${e.name} (${e.multiplier}x)`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Available Events')
                .setDescription(eventList || 'No events configured.')
                .setColor(config.embedColors?.default || config.themeColor);
            return interaction.reply({ embeds: [embed] });
        }

        const eventId = eventIdRaw.toLowerCase();
        const eventConfig = config.events.find(e => e.id === eventId);

        if (!eventConfig) {
            return interaction.reply({ content: `❌ **Event ID \`${eventId}\` not found.**\nUse \`/event\` with no arguments to view valid IDs.`, ephemeral: true });
        }

        // Check if event is already running
        const isActive = EventManager.isEventActive(eventId);

        if (!durationStrRaw) {
            // Toggle off or show missing duration
            if (isActive) {
                EventManager.stopEvent(eventId);
                const embed = new EmbedBuilder()
                    .setTitle('⏹️ Event Stopped')
                    .setDescription(`The **${eventConfig.name}** event has been manually disabled.`)
                    .setColor(config.embedColors?.error || config.errorColor);
                return interaction.reply({ embeds: [embed] });
            } else {
                return interaction.reply({ content: `❌ **Event is not running.**\nTo start it, provide a duration: \`/event <id> <duration>\``, ephemeral: true });
            }
        }

        // Parse duration string
        const durationStr = durationStrRaw.toLowerCase();
        let msToAdd = 0;
        let limitConfig = config.eventDurationLimits;

        const hourMatch = durationStr.match(/^(\d+)h$/);
        const dayMatch = durationStr.match(/^(\d+)d$/);
        const monthMatch = durationStr.match(/^(\d+)mo$/);

        if (hourMatch) {
            const val = parseInt(hourMatch[1]);
            if (val > limitConfig.h) return interaction.reply({ content: `❌ **Duration exceeds limits.** Max hours: \`${limitConfig.h}\``, ephemeral: true });
            msToAdd = val * 60 * 60 * 1000;
        } else if (dayMatch) {
            const val = parseInt(dayMatch[1]);
            if (val > limitConfig.d) return interaction.reply({ content: `❌ **Duration exceeds limits.** Max days: \`${limitConfig.d}\``, ephemeral: true });
            msToAdd = val * 24 * 60 * 60 * 1000;
        } else if (monthMatch) {
            const val = parseInt(monthMatch[1]);
            if (val > limitConfig.mo) return interaction.reply({ content: `❌ **Duration exceeds limits.** Max months: \`${limitConfig.mo}\``, ephemeral: true });
            msToAdd = val * 30 * 24 * 60 * 60 * 1000; // Approximating month as 30 days
        } else {
            return interaction.reply({ content: `❌ **Invalid duration format.** Use \`h\` (hours), \`d\` (days), or \`mo\` (months).\nExample: \`/event double_payday 2h\``, ephemeral: true });
        }

        const startMs = Date.now();
        const endMs = startMs + msToAdd;

        const success = EventManager.startEvent(eventId, startMs, endMs);
        if (success) {
            const embed = new EmbedBuilder()
                .setTitle(`▶️ Event Activated: ${eventConfig.name}`)
                .setDescription(`This event is now live globally and will run until <t:${Math.floor(endMs / 1000)}:f>.`)
                .setColor(config.embedColors?.success || config.successColor);
            return interaction.reply({ embeds: [embed] });
        } else {
            return interaction.reply({ content: `❌ Failed to start the event. Check server logs.`, ephemeral: true });
        }
    }
};
