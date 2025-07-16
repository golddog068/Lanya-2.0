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
};

const SERVER_IDS = {
  'server-1': '1068716889901125742',
  'server-2': '1389561970210111538',
};

const HOST_ROLE_ID = '1068934061189496912';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('startup')
    .setDescription('Initiate a session startup.')
    .addStringOption(option =>
      option.setName('server')
        .setDescription('Choose the server to start session in.')
        .setRequired(true)
        .addChoices(
          { name: 'Server 1', value: 'server-1' },
          { name: 'Server 2', value: 'server-2' }
        )
    )
    .addStringOption(option =>
      option.setName('earlyaccesslink')
        .setDescription('Link for early access.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const member = interaction.member;
      if (!member.roles.cache.has(HOST_ROLE_ID)) {
        return await interaction.reply({
          content: '❌ You are not authorized to use this command.',
          ephemeral: true,
        });
      }

      const serverChoice = interaction.options.getString('server');
      const targetChannelId = SERVER_IDS[serverChoice];
      const earlyAccessLink = interaction.options.getString('earlyaccesslink');

      const channel = await interaction.client.channels.fetch(targetChannelId);

      await interaction.reply({
        content: '📬 Check your DMs to configure session startup.',
        ephemeral: true,
      });

      // Send config prompt in DM
      const configPrompt = await interaction.user.send({
        content: `🛠️ Click the button below to confirm session startup in <#${targetChannelId}>.`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('confirm_startup')
              .setLabel('✅ Confirm Startup')
              .setStyle(ButtonStyle.Success)
          )
        ]
      });

      const dmCollector = configPrompt.createMessageComponentCollector({ time: 5 * 60 * 1000, max: 1 });

      dmCollector.on('collect', async (btn) => {
        if (btn.customId === 'confirm_startup') {
          await btn.deferUpdate();

          // STEP 1: Send Startup Embed
          const startupEmbed = new EmbedBuilder()
            .setTitle('📢 Session Startup')
            .setDescription('Setting up session...')
            .setColor(0x5865f2)
            .setImage(STARTUP_IMAGES.startup)
            .setTimestamp();

          await channel.send({
            content: '@everyone',
            embeds: [startupEmbed],
            allowedMentions: { parse: ['everyone'] },
          });

          // STEP 2: Send Early Access Embed
          const earlyEmbed = new EmbedBuilder()
            .setTitle('🚪 Early Access Open')
            .setDescription('Staff, Boosters, and Public Services may now join.')
            .setColor(0xffb347)
            .setImage(STARTUP_IMAGES.earlyAccess)
            .setTimestamp();

          const earlyAccessButton = new ButtonBuilder()
            .setLabel('Join Early Access')
            .setStyle(ButtonStyle.Link)
            .setURL(earlyAccessLink);

          const earlyRow = new ActionRowBuilder().addComponents(earlyAccessButton);

          await channel.send({
            content: '@everyone',
            embeds: [earlyEmbed],
            components: [earlyRow],
            allowedMentions: { parse: ['everyone'] },
          });

          // STEP 3: Ask to release session
          const releasePrompt = await interaction.user.send({
            content: '🟢 Click below when you’re ready to release the session.',
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId('release_session')
                  .setLabel('Release Session')
                  .setStyle(ButtonStyle.Primary)
              )
            ]
          });

          const releaseCollector = releasePrompt.createMessageComponentCollector({ time: 30 * 60 * 1000 });

          releaseCollector.on('collect', async (releaseBtn) => {
            if (releaseBtn.customId === 'release_session') {
              await releaseBtn.deferUpdate();

              const releaseEmbed = new EmbedBuilder()
                .setTitle('✅ Session Released')
                .setDescription('Welcome to today’s RP session. Please follow the details below.')
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
                content: '@everyone',
                embeds: [releaseEmbed],
                components: [joinRow],
                allowedMentions: { parse: ['everyone'] },
              });

              const joinCollector = releasedMessage.createMessageComponentCollector({ time: 60 * 60 * 1000 });

              joinCollector.on('collect', async (joinBtn) => {
                if (joinBtn.customId === 'get_session_link') {
                  await joinBtn.reply({
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
      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ Something went wrong while running the command.',
          ephemeral: true,
        });
      }
    }
  },
};
