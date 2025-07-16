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
    .setDescription('Initiate a session startup with setup parameters.')
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
      // 1. Defer reply quickly so we avoid timeouts
      await interaction.deferReply({ ephemeral: true });

      // Authorization check
      if (!interaction.member.roles.cache.has(HOST_ROLE_ID)) {
        return interaction.editReply({ content: "❌ You're not authorized." });
      }

      const serverChoice = interaction.options.getString('server');
      const channelId = SERVER_IDS[serverChoice];
      const earlyLink = interaction.options.getString('earlyaccesslink');
      const channel = await interaction.client.channels.fetch(channelId);
      if (!channel) {
        return interaction.editReply({ content: '❌ Channel not found.' });
      }

      // Confirm we'll DM the host
      await interaction.editReply({ content: '📬 Check your DMs to complete setup.' });

      // In DMs: ask for reaction goal
      const dmChannel = await interaction.user.createDM();
      await dmChannel.send('How many ✅ reactions should be needed to start the session? (Enter a number)');

      const dmFilter = msg => msg.author.id === interaction.user.id;
      const dmCollected = await dmChannel.awaitMessages({ filter: dmFilter, max: 1, time: 60000 });
      const reactionGoal = parseInt(dmCollected.first()?.content, 10);
      if (!reactionGoal || reactionGoal < 1) {
        return dmChannel.send('❌ Invalid number entered. Setup cancelled.');
      }

      // Confirm startup with a button
      const confirmPrompt = await dmChannel.send({
        content: `Press ✅ to start the session in <#${channelId}> with **${reactionGoal}** reactions needed.`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('confirm_startup')
              .setLabel('✅ Confirm Startup')
              .setStyle(ButtonStyle.Success)
          )
        ]
      });

      const collector = confirmPrompt.createMessageComponentCollector({ max: 1, time: 300000 });
      collector.on('collect', async btn => {
        await btn.deferUpdate();

        // A) Send Startup embed
        const startupEmbed = new EmbedBuilder()
          .setTitle('📢 Session Startup')
          .setDescription(`**${reactionGoal}+ Reactions Needed**\nReact with ✅ to start session.`)
          .setColor(0x5865f2)
          .setImage(STARTUP_IMAGES.startup)
          .setTimestamp();

        const startupMsg = await channel.send({
          content: '@everyone',
          embeds: [startupEmbed],
          allowedMentions: { parse: ['everyone'] },
        });
        await startupMsg.react('✅');

        // B) Send Early Access embed & button
        const earlyEmbed = new EmbedBuilder()
          .setTitle('🚪 Early Access Open')
          .setDescription('Staff, Boosters, and Public Services may now join.')
          .setColor(0xffb347)
          .setImage(STARTUP_IMAGES.earlyAccess)
          .setTimestamp();

        const earlyBtn = new ButtonBuilder()
          .setLabel('Join Early Access')
          .setStyle(ButtonStyle.Link)
          .setURL(earlyLink);

        await channel.send({
          content: '@everyone',
          embeds: [earlyEmbed],
          components: [new ActionRowBuilder().addComponents(earlyBtn)],
          allowedMentions: { parse: ['everyone'] },
        });

        // C) Ask host to release session
        const releasePrompt = await dmChannel.send({
          content: '🟢 Click below when ready to release session.',
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('release_session')
                .setLabel('Release Session')
                .setStyle(ButtonStyle.Primary)
            )
          ]
        });

        const releaseCollector = releasePrompt.createMessageComponentCollector({ max: 1, time: 3600000 });
        releaseCollector.on('collect', async releaseBtn => {
          await releaseBtn.deferUpdate();

          // C) Send Session Released embed + join button
          const releaseEmbed = new EmbedBuilder()
            .setTitle('✅ Session Released')
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

          const joinBtn = new ButtonBuilder()
            .setCustomId('get_session_link')
            .setLabel('Join Session')
            .setStyle(ButtonStyle.Primary);

          const releaseMsg = await channel.send({
            content: '@everyone',
            embeds: [releaseEmbed],
            components: [new ActionRowBuilder().addComponents(joinBtn)],
            allowedMentions: { parse: ['everyone'] },
          });

          const joinCollector = releaseMsg.createMessageComponentCollector({ time: 3600000 });
          joinCollector.on('collect', async joinBtnClick => {
            if (joinBtnClick.customId === 'get_session_link') {
              await joinBtnClick.reply({ content: `🔗 Session Link: ${earlyLink}`, ephemeral: true });
            }
          });
        });
      });

    } catch (err) {
      console.error('Error in /startup:', err);
      if (!interaction.replied && !interaction.deferred) {
        interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
      }
    }
  }
};
