\require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.GUILD_ID; // Add your test server's guild ID to .env
const token = process.env.DISCORD_TOKEN;

async function deploy() {
  try {
    const commands = [];

    const commandsPath = path.join(__dirname, 'commands');
    if (!fs.existsSync(commandsPath)) {
      console.error('Commands folder not found:', commandsPath);
      return;
    }

    const categories = fs.readdirSync(commandsPath);

    for (const category of categories) {
      const categoryPath = path.join(commandsPath, category);
      const commandFiles = fs
        .readdirSync(categoryPath)
        .filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const command = require(path.join(categoryPath, file));
        if (command.data && typeof command.data.toJSON === 'function') {
          commands.push(command.data.toJSON());
        } else {
          console.warn(`Skipping command ${file} - missing or invalid .data.toJSON()`);
        }
      }
    }

    console.log(`Loaded commands: ${commands.map(c => c.name).join(', ')}`);

    const rest = new REST({ version: '10' }).setToken(token);

    console.log('Started refreshing application (/) commands...');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
}

deploy();
