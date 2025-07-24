require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// === Global styles setup ===
global.styles = {
  successColor: (msg) => console.log(chalk.green.bold(msg)),
  errorColor: (msg) => console.log(chalk.red.bold(msg)),
  warnColor: (msg) => console.log(chalk.yellow.bold(msg)),
  infoColor: (msg) => console.log(chalk.cyan.bold(msg)),
};

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
const deployCommands = require('./handlers/deployCommands');
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

// === Load handlers (functions and event objects) ===
const handlerFiles = fs
  .readdirSync(path.join(__dirname, 'handlers'))
  .filter(file => file.endsWith('.js'));

let counter = 0;
for (const file of handlerFiles) {
  const handler = require(`./handlers/${file}`);
  
  if (typeof handler === 'function') {
    handler(client); // for handlers like commandHandler.js
    counter++;
  } else if (handler.name && typeof handler.execute === 'function') {
    client.on(handler.name, (...args) => handler.execute(...args)); // for event handlers like interactionCreate.js
    counter++;
  }
}
global.styles.successColor(`✅ Loaded ${counter} handlers`);

// === Client event listeners for debugging ===
client.once('ready', () => {
  global.styles.successColor(`✅ Logged in as ${client.user.tag}`);
});

client.on('error', (error) => {
  global.styles.errorColor('Client error:');
  console.error(error);
});

client.on('warn', (info) => {
  global.styles.warnColor('Client warning:');
  console.warn(info);
});

process.on('unhandledRejection', (error) => {
  global.styles.errorColor('Unhandled promise rejection:');
  console.error(error);
});

// Debug token presence
console.log(process.env.DISCORD_TOKEN ? 'Token loaded ✅' : 'Token missing ❌');

// Log the bot in
client.login(process.env.DISCORD_TOKEN);
