const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Show items available for purchase'),
  async execute(interaction, client) {
    try {
      const { data: shopSettings } = await client.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'shop_prices')
        .single();
      const KEY_PRICE = shopSettings?.value?.key_price || 10;
      const ROLE_PRICE = shopSettings?.value?.role_price || 5;
      const ROLE_ID = config.premiumRoleId || 'ROLE_ID_HERE';
      let roleName = 'Premium Role';
      if (interaction.guild) {
        const role = interaction.guild.roles.cache.get(ROLE_ID);
        if (role) roleName = role.name;
      }
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🛒 Kryptonite Shop')
        .setDescription('Spend your coins on premium items:')
        .addFields(
          { name: '🔑 Executor Key', value: `• Price: **${KEY_PRICE} coins**\n• Command: \`/buykey\``, inline: true },
          { name: `👑 ${roleName}`, value: `• Price: **${ROLE_PRICE} coins**\n• Command: \`/buyrole\``, inline: true }
        )
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Slash shop error:', err);
      await interaction.reply({ content: 'Failed to display the shop.', ephemeral: true });
    }
  }
};
