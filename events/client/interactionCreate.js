const { Events, MessageFlags, InteractionType } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // Slash Command
      if (interaction.type === InteractionType.ApplicationCommand) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`No command matching ${interaction.commandName} was found.`);
          return;
        }

        try {
          await command.execute(interaction);
        } catch (error) {
          console.error('Command execution error:', error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: 'There was an error while executing this command!',
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: 'There was an error while executing this command!',
              ephemeral: true,
            });
          }
        }
      }

      // Autocomplete
      else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (command && command.autocomplete) {
          try {
            await command.autocomplete(interaction);
          } catch (error) {
            console.error('Autocomplete error:', error);
            await interaction.respond([]);
          }
        }
      }
    } catch (err) {
      console.error('Interaction error:', err);
    }
  },
};
