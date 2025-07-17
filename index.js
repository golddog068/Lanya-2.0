require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// === Express server to keep Render alive ===
const app = express();
app.get('/', (req, res) => {
  res.send('Everything is up!');
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

// === Deploy slash commands on start ===
const deployCommands = require('./handlers/deployCommands'); // make sure this path is correct
deployCommands(); // deploy commands once on startup

// === Initialize Discord client ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// === Load handlers ===
const handlerFiles = fs
  .readdirSync(path.join(__dirname, 'handlers'))
  .filter(file => file.endsWith('.js'));

let counter = 0;
for (const file of handlerFiles) {
  counter++;
  const handler = require(`./handlers/${file}`);
  if (typeof handler === 'function') {
    handler(client);
  }
}
console.log(chalk.bold.green(`✅ Loaded ${counter} handlers`));

// === Client event listeners for debugging ===
client.once('ready', () => {
  console.log(chalk.bold.green(`✅ Logged in as ${client.user.tag}`));
});

client.on('error', (error) => {
  console.error(chalk.red('Client error:'), error);
});

client.on('warn', (info) => {
  console.warn(chalk.yellow('Client warning:'), info);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled promise rejection:'), error);
});

// Debug token presence
console.log(process.env.DISCORD_TOKEN ? 'Token loaded ✅' : 'Token missing ❌');

// Log the bot in
client.login(process.env.DISCORD_TOKEN);
