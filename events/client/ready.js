const { Events } = require('discord.js');
const updateStatus = require('./statusRotation');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      console.log(`✅ Logged in as ${client.user.tag}`); // <-- This was missing!

      await updateStatus(client);

      console.log('🚀 Bot is ready and status rotation started!');
    } catch (error) {
      console.error('❌ Error in ClientReady event:', error);
    }
  },
};
