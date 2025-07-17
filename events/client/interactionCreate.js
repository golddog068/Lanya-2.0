const { Events, InteractionType } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    try {
      // === Slash Command ===
      if (interaction.type === InteractionType.ApplicationCommand) {
        console.log(`➡️ Slash command triggered: ${interaction.commandName}`);

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
          console.warn(`⚠️ No command matching ${interaction.commandName} was found.`);
          return;
        }

        try {
          // Defer reply to avoid 3s timeout
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: false }); // change to true if private
          }

          // Make sure execute function exists
          if (typeof command.execute === 'function') {
            await command.execute(interaction);
          } else {
            console.warn(`⚠️ Command "${interaction.commandName}" has no execute function.`);
            await interaction.editReply('This command is currently broken.');
          }
        } catch (error) {
          console.error(`❌ Error executing command "${interaction.commandName}":`, error);

          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: '❌ There was an error while executing this command.',
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: '❌ There was an error while executing this command.',
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

      // === Other interaction types (e.g. buttons, modals) ===
      else {
        // Add handling here if needed
      }

    } catch (err) {
      console.error('❌ General interaction handler error:', err);
    }
  },
};
