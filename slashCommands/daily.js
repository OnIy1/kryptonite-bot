const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),
  async execute(interaction, client) {
    try {
      await client.db.ensureUser(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
      const result = await client.db.claimDaily(interaction.user.id);
      if (result.error) throw new Error(result.error);
      if (result.cooldown) {
        const embed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('⏰ Daily Reward Cooldown')
          .setDescription(`Come back in **${result.remainingTime}** to claim again.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🎁 Daily Reward Claimed!')
          .setDescription(`You received **${result.coins}** coins and now have **${result.newBalance}** total.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (err) {
      console.error('Slash daily error:', err);
      await interaction.reply({ content: 'Failed to claim daily.', ephemeral: true });
    }
  }
};
