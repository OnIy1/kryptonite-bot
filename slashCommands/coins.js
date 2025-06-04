const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coins')
    .setDescription('Check coin balance for yourself or another user')
    .addUserOption(option =>
      option.setName('user').setDescription('User to check').setRequired(false)
    ),
  async execute(interaction, client) {
    const target = interaction.options.getUser('user') || interaction.user;
    try {
      await client.db.ensureUser(
        target.id,
        target.username,
        target.displayAvatarURL()
      );
      const { data: userData } = await client.db.getUser(target.id);
      const coins = userData ? userData.coins : 0;
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('\uD83D\uDCB0 Coin Balance')
        .setDescription(`${target} has **${coins}** Krypton Coins.`)
        .setThumbnail(target.displayAvatarURL())
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (err) {
      console.error('Slash coins error:', err);
      await interaction.reply({ content: 'Failed to fetch coins.', ephemeral: true });
    }
  }
};
