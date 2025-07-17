require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.GUILD_ID; // leave this empty if you're not using it
const token = process.env.DISCORD_TOKEN;

const commands = [];

const commandsPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(folderPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🔁 Deploying application commands...');

    // Set to TRUE if you want to use GUILD commands (for testing, instant deploy)
    const useGuild = false;

    if (useGuild && guildId) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log('✅ Guild commands deployed!');
    } else {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('✅ Global commands deployed!');
    }
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
})();
