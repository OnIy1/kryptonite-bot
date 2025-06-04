const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('booststatus')
    .setDescription('Check if a coin boost is active'),
  async execute(interaction, client) {
    try {
      if (!client.boostSystem.active || !client.boostSystem.endTime || client.boostSystem.endTime <= Date.now()) {
        const { data } = await client.supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'boost_system')
          .single();
        if (data && data.value && data.value.active && data.value.endTime > Date.now()) {
          client.boostSystem = data.value;
        } else {
          const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Boost Status')
            .setDescription('There is no active coin boost at the moment.');
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }
      const remaining = client.boostSystem.endTime - Date.now();
      const minutes = Math.floor(remaining / (60 * 1000));
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeDisplay = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` and ${mins} minute${mins !== 1 ? 's' : ''}` : ''}` : `${mins} minute${mins !== 1 ? 's' : ''}`;
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🚀 Boost Status')
        .setDescription(`A ${client.boostSystem.multiplier}x coin boost is active!\nTime remaining: **${timeDisplay}**`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error('Slash booststatus error:', err);
      await interaction.reply({ content: 'Failed to check boost status.', ephemeral: true });
    }
  }
};
