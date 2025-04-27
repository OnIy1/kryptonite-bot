// commands/shop.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'shop',
  description: 'Shows items available for purchase',
  cooldown: 5,
  async execute(client, message, args) {
    try {
      // Get shop prices from system settings in Supabase
      const { data: shopSettings } = await client.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'shop_prices')
        .single();
      
      // Default prices if not found in database
      const KEY_PRICE = shopSettings?.value?.key_price || 10;
      const ROLE_PRICE = shopSettings?.value?.role_price || 5;
      
      // Get role name for display
      const ROLE_ID = config.premiumRoleId || 'ROLE_ID_HERE';
      let roleName = 'Premium Role';
      
      if (message.guild) {
        const role = message.guild.roles.cache.get(ROLE_ID);
        if (role) {
          roleName = role.name;
        }
      }
      
      // Create shop embed
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🛒 Kryptonite Shop')
        .setDescription('Spend your coins on premium items:')
        .addFields(
          { 
            name: '🔑 Executor Key', 
            value: `• Price: **${KEY_PRICE} coins**\n• Command: \`!buykey\``, 
            inline: true 
          },
          { 
            name: `👑 ${roleName}`, 
            value: `• Price: **${ROLE_PRICE} coins**\n• Command: \`!buyrole\``, 
            inline: true 
          }
        )
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing shop command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error displaying the shop.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.reply({ embeds: [errorEmbed] });
    }
  }
};