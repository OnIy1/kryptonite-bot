const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('key')
    .setDescription('Generate or view your executor key'),
  async execute(interaction, client) {
    try {
      await client.db.ensureUser(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
      const { data: user } = await client.db.getUser(interaction.user.id);
      if (user.is_banned) {
        const embed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Access Denied')
          .setDescription(`You are banned from using Krypton Executor.${user.ban_reason ? `\nReason: ${user.ban_reason}` : ''}`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      if (user.key) {
        const dmEmbed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🔑 Your Krypton Executor Key')
          .setDescription(`Here's your key:\n\`${user.key}\``);
        await interaction.user.send({ embeds: [dmEmbed] });
        const channelEmbed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🔒 Key Sent')
          .setDescription('I\'ve sent your key via DM!');
        return interaction.reply({ embeds: [channelEmbed], ephemeral: true });
      }
      if (user.coins < 100) {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('⚠️ Insufficient Coins')
          .setDescription(`You need at least 100 coins to generate a key. You currently have **${user.coins}** coins.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      const { key } = await client.db.generateKey(interaction.user.id);
      await client.db.updateCoins(interaction.user.id, -100);
      await client.db.logAction('key_generated', interaction.user.id, { cost: 100 });
      const dmEmbed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🔑 Your New Krypton Executor Key')
        .setDescription(`Here's your key:\n\`${key}\`\n\n100 coins have been deducted.`);
      await interaction.user.send({ embeds: [dmEmbed] });
      const channelEmbed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🔒 Key Generated!')
        .setDescription('I\'ve sent your new key via DM! 100 coins deducted.');
      await interaction.reply({ embeds: [channelEmbed], ephemeral: true });
    } catch (err) {
      console.error('Slash key error:', err);
      await interaction.reply({ content: 'There was an error generating your key.', ephemeral: true });
    }
  }
};
