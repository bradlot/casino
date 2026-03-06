const fs = require('fs');
const path = require('path');

const loadEvents = (client) => {
    let count = 0;
    const eventsPath = path.join(__dirname, '../events');

    // Ensure directory exists
    if (!fs.existsSync(eventsPath)) {
        fs.mkdirSync(eventsPath, { recursive: true });
        return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        count++;
    }
    console.log(`[Handler] Loaded ${count} events.`);
};

module.exports = { loadEvents };
