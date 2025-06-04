const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cmds')
    .setDescription('Display available bot commands'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor || '#1FB1B6')
      .setTitle('Krypton Bot Commands')
      .setDescription('Below are some helpful commands:')
      .addFields(
 e1cas2-codex/fix-discord-bot
        { name: '/profile', value: 'Display your user profile', inline: true },
        { name: '/coins', value: 'Check your coin balance', inline: true },
        { name: '/shop', value: 'View items available for purchase', inline: true }

        { name: `${config.prefix}help`, value: 'Shows all available commands', inline: true },
        { name: `${config.prefix}profile`, value: 'Displays your user profile', inline: true },
        { name: `${config.prefix}coins`, value: 'Check your coin balance', inline: true }
 main
      )
      .setFooter({ text: 'Krypton Executor' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/yourserver'),
      new ButtonBuilder()
        .setCustomId('admin_cmds')
        .setLabel('Admin Commands')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
