const { Events, InteractionType } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    try {
      // === Slash Command ===
      if (interaction.type === InteractionType.ApplicationCommand) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
          console.warn(`⚠️ No command matching ${interaction.commandName} was found.`);
          return;
        }

        try {
          // Defer reply to avoid 3s timeout if the command does async work
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: false }); // set to true if you want it private
          }

          // Execute the slash command
          await command.execute(interaction);
        } catch (error) {
          console.error(`❌ Error executing command ${interaction.commandName}:`, error);

          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: 'There was an error while executing this command.',
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: 'There was an error while executing this command.',
              ephemeral: true,
            });
          }
        }
      }

      // === Autocomplete Handler ===
      else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (command && typeof command.autocomplete === 'function') {
          try {
            await command.autocomplete(interaction);
          } catch (error) {
            console.error('❌ Autocomplete error:', error);
            try {
              await interaction.respond([]); // fallback safe response
            } catch (_) {
              // fail silently
            }
          }
        }
      }

      // === Other interactions (like buttons, modals) ===
      else {
        // You can handle other types here if needed (e.g. interaction.isButton(), etc.)
      }

    } catch (err) {
      console.error('❌ General interaction handler error:', err);
    }
  },
};
