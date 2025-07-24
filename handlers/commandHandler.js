const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.commands = new Map();

  const commandsPath = path.join(__dirname, '../commands');
  const categories = fs.readdirSync(commandsPath);

  let commandCount = 0;
  let categoryCount = categories.length;

  categories.forEach((category) => {
    const categoryPath = path.join(commandsPath, category);
    const commandFiles = fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(categoryPath, file));

      if (command?.data?.name && typeof command.execute === 'function') {
        client.commands.set(command.data.name, { ...command, category });
        commandCount++;
      } else {
        console.warn(`⚠️ Skipping invalid command file: ${file}`);
      }
    }
  });

  console.log(
    global.styles.successColor(
      `✅ Loaded ${commandCount} commands across ${categoryCount} categories.`
    )
  );
};
