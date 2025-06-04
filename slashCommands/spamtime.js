const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spamtime')
    .setDescription('Show the current spam protection cooldown'),
  async execute(interaction, client) {
    try {
      const { data: cooldownSettings } = await client.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'message_cooldown')
        .single();
      const cooldownSeconds = cooldownSettings?.value?.seconds || config.messageCooldown || 60;
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('⏱️ Spam Protection')
        .setDescription(`Current spam cooldown is **${cooldownSeconds} seconds**.`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error('Slash spamtime error:', err);
      await interaction.reply({ content: 'Failed to fetch cooldown.', ephemeral: true });
    }
  }
};
