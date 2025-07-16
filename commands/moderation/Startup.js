const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const STARTUP_IMAGES = {
  startup: 'https://ik.imagekit.io/pxhnsvi5v/startup.png?updatedAt=1752697731206',
  earlyAccess: 'https://ik.imagekit.io/pxhnsvi5v/early%20access.png?updatedAt=1752697731401',
  released: 'https://ik.imagekit.io/pxhnsvi5v/session%20released.png?updatedAt=1752697730832',
  reinvites: 'https://ik.imagekit.io/pxhnsvi5v/reinvites.png?updatedAt=1752697730827',
};

// IDs
const SERVER_IDS = {
  'server-1': '1068716889901125742',
  'server-2': '1389561970210111538',
};
const EARLY_ACCESS_ROLE_ID = '1068934061189496912';
const HOST_ROLE_ID = '1068934061189496912';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('startup')
    .setDescription('Initiate a session startup.')
    .addStringOption(option =>
      option
        .setName('server')
        .setDescription('Choose which server to start the session in.')
        .setRequired(true)
        .addChoices(
          { name: 'Server 1', value: 'server-1' },
          { name: 'Server 2', value: 'server-2' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('reactions')
        .setDescription('Number of ✅ reactions required to start session.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('earlyaccesslink')
        .setDescription('Link to join for early access.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Permission check
      if (!interaction.member.roles.cache.has(HOST_ROLE_ID)) {
        return interaction.editReply({
          content: '❌ You are not authorized to use this command.',
        });
      }

      const serverChoice = interaction.options.getString('server');
      const targetChannelId = SERVER_IDS[serverChoice];
      const reactionGoal = interaction.options.getInteger('reactions');
      const earlyAccessLink = interaction.options.getString('earlyaccesslink');

      const channel = await interaction.client.channels.fetch(targetChannelId);

      // Startup Embed
      const startupEmbed = new EmbedBuilder()
        .setTitle('📢 Session Startup')
        .setDescription(`@everyone\n**${reactionGoal}+ Reactions Needed**\nReact with ✅ to start session.`)
        .setColor(0x5865f2)
        .setImage(STARTUP_IMAGES.startup)
        .setTimestamp();

      const startupMessage = await channel.send({ embeds: [startupEmbed] });
      await startupMessage.react('✅');

      await interaction.editReply({
        content: `✅ Startup prompt sent in <#${targetChannelId}>. Awaiting ${reactionGoal} ✅ reactions.`,
      });

      // Reaction collector
      const filter = (reaction, user) => reaction.emoji.name === '✅' && !user.bot;
      const collector = startupMessage.createReactionCollector({ filter, time: 60 * 60 * 1000 });

      collector.on('collect', async (reaction) => {
        const count = reaction.count - 1; // exclude bot reaction
        if (count >= reactionGoal) {
          collector.stop();

          // Early Access Embed
          const earlyEmbed = new EmbedBuilder()
            .setTitle('🚪 Early Access Open')
            .setDescription('@everyone\nSession is being setup.\nStaff, Boosters, and Public Services may now join.')
            .setColor(0xffb347)
            .setImage(STARTUP_IMAGES.earlyAccess)
            .setTimestamp();

          const earlyAccessButton = new ButtonBuilder()
            .setLabel('Join Early Access')
            .setStyle(ButtonStyle.Link)
            .setURL(earlyAccessLink);

          const earlyRow = new ActionRowBuilder().addComponents(earlyAccessButton);
          await channel.send({ embeds: [earlyEmbed], components: [earlyRow] });

          await interaction.user.send(`✅ Startup prompt reached ${reactionGoal} reactions. Early access link is now public.`);

          // Ask user to confirm session release
          const releasePrompt = await interaction.user.send({
            content: '🟢 Click the button below when you are ready to **release the session**.',
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId('release_session')
                  .setLabel('Release Session')
                  .setStyle(ButtonStyle.Success)
              ),
            ],
          });

          const dmCollector = releasePrompt.createMessageComponentCollector({
            time: 30 * 60 * 1000,
          });

          dmCollector.on('collect', async (btnInteraction) => {
            if (btnInteraction.customId === 'release_session') {
              await btnInteraction.deferUpdate();

              const releaseEmbed = new EmbedBuilder()
                .setTitle('✅ Session Released')
                .setDescription('@everyone\nWelcome to today’s RP session. Please follow the information below.')
                .addFields(
                  { name: 'Speed Limit', value: '90 MPH', inline: true },
                  { name: 'FRP Limit', value: 'Yes', inline: true },
                  { name: 'PT', value: 'Off', inline: true },
                  { name: 'RP Type', value: 'Freeroam / Civ Priority', inline: true },
                  { name: 'House Claiming', value: 'Enabled', inline: true },
                  { name: 'Co-Host', value: 'N/A', inline: true }
                )
                .setImage(STARTUP_IMAGES.released)
                .setColor(0x57f287)
                .setTimestamp();

              const joinButton = new ButtonBuilder()
                .setCustomId('get_session_link')
                .setLabel('Join Session')
                .setStyle(ButtonStyle.Primary);

              const joinRow = new ActionRowBuilder().addComponents(joinButton);
              const releasedMessage = await channel.send({
                embeds: [releaseEmbed],
                components: [joinRow],
              });

              const joinCollector = releasedMessage.createMessageComponentCollector({
                time: 60 * 60 * 1000,
              });

              joinCollector.on('collect', async (btn) => {
                if (btn.customId === 'get_session_link') {
                  await btn.reply({
                    content: `🔗 Session Link: ${earlyAccessLink}`,
                    ephemeral: true,
                  });
                }
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Error in /startup:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: '❌ An error occurred while running the command.',
        });
      } else {
        await interaction.reply({
          content: '❌ An error occurred while running the command.',
          ephemeral: true,
        });
      }
    }
  },
};
