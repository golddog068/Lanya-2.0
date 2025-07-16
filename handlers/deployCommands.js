// utils/deployCommands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional, for testing
const token = process.env.DISCORD_TOKEN;

async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, '../commands');

  fs.readdirSync(commandsPath).forEach((category) => {
    const categoryPath = path.join(commandsPath, category);
    const commandFiles = fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(categoryPath, file));
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
  });

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('🔁 Deploying application commands to Discord...');

    // GUILD deployment (faster for dev) — uncomment this block for testing
    // await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    // GLOBAL deployment — use this in production
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log('✅ Commands successfully deployed.');
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
}

module.exports = deployCommands;
