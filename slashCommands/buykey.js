const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buykey')
    .setDescription('Purchase an executor key'),
  async execute(interaction, client) {
    const KEY_PRICE = 10;
    try {
      await client.db.ensureUser(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
      const { data: user } = await client.db.getUser(interaction.user.id);
      if (user.coins < KEY_PRICE) {
        const e = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Insufficient Coins')
          .setDescription(`You need at least **${KEY_PRICE} coins** to buy a key.`);
        return interaction.reply({ embeds: [e], ephemeral: true });
      }
      const { key } = await client.db.generateKey(interaction.user.id);
      await client.db.updateCoins(interaction.user.id, -KEY_PRICE);
      await client.db.logAction('key_purchased', interaction.user.id, { cost: KEY_PRICE });
      const dmEmbed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🔑 Your Krypton Executor Key')
        .setDescription(`Here's your key:\n\`${key}\``);
      try {
        await interaction.user.send({ embeds: [dmEmbed] });
        const confirm = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('✅ Key Purchased')
          .setDescription('Check your DMs for the key.');
        await interaction.reply({ embeds: [confirm], ephemeral: true });
      } catch (err) {
        await client.db.updateCoins(interaction.user.id, KEY_PRICE);
        await interaction.reply({ content: 'Unable to DM you. Purchase cancelled.', ephemeral: true });
      }
    } catch (err) {
      console.error('Slash buykey error:', err);
      await interaction.reply({ content: 'Error processing purchase.', ephemeral: true });
    }
  }
};
