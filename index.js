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
app.listen(10000, () => {
  console.log('✅ Express server running on http://localhost:10000');
});

// === Deploy slash commands on start ===
const deployCommands = require('./handlers/deployCommands'); // make sure path is correct
deployCommands(); // this runs when bot starts

// === Initialize Discord client ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// === Custom global styles (for console logs) ===
global.styles = {
  successColor: chalk.bold.green,
  warningColor: chalk.bold.yellow,
  infoColor: chalk.bold.blue,
  commandColor: chalk.bold.cyan,
  userColor: chalk.bold.magenta,
  errorColor: chalk.red,
  highlightColor: chalk.bold.hex('#FFA500'),
  accentColor: chalk.bold.hex('#00FF7F'),
  secondaryColor: chalk.hex('#ADD8E6'),
  primaryColor: chalk.bold.hex('#FF1493'),
  dividerColor: chalk.hex('#FFD700'),
};

// === Load command & event handlers ===
const handlerFiles = fs
  .readdirSync(path.join(__dirname, 'handlers'))
  .filter((file) => file.endsWith('.js'));

let counter = 0;
for (const file of handlerFiles) {
  counter += 1;
  const handler = require(`./handlers/${file}`);
  if (typeof handler === 'function') {
    handler(client);
  }
}
console.log(global.styles.successColor(`✅ Loaded ${counter} handlers`));

// === Bot login ===
client.login(process.env.DISCORD_TOKEN);
