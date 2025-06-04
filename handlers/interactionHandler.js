const fs = require('fs');
const path = require('path');
const { Collection, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  init(client) {
    client.slashCommands = new Collection();
    const commandsPath = path.join(__dirname, '..', 'slashCommands');
    if (fs.existsSync(commandsPath)) {
      const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
      for (const file of files) {
        const command = require(path.join(commandsPath, file));
        if (command.data && typeof command.execute === 'function') {
          client.slashCommands.set(command.data.name, command);
        }
      }
    }
    console.log(`✅ Loaded ${client.slashCommands.size} slash commands.`);
  },

  async register(client) {
    if (!client.slashCommands) return;
    const commandsJSON = client.slashCommands.map(cmd => cmd.data.toJSON());
    await client.application.commands.set(commandsJSON);
    console.log(`✅ Registered ${commandsJSON.length} slash commands.`);
  },

  async handle(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error('Error executing slash command:', error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'There was an error executing that command.', ephemeral: true });
        } else {
          await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === 'admin_cmds') {
        const embed = new EmbedBuilder()
          .setColor(config.embedColor || '#1FB1B6')
          .setTitle('Admin Commands')
          .setDescription(`Use \`${config.prefix}ahelp\` to view admin commands.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }
};
