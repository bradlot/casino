const fs = require('fs');
const path = require('path');

const loadCommands = (client) => {
    let count = 0;
    const commandsPath = path.join(__dirname, '../commands');

    // Ensure directory exists
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }

    // Read subfolders (categories)
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);

        // Skip files in the root commands folder if any exist
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);

            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                // Attach the category folder name to the command object
                command.category = folder;
                client.commands.set(command.data.name, command);
                count++;
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
    console.log(`[Handler] Loaded ${count} slash commands.`);
};

module.exports = { loadCommands };
