// commands/spamtime.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'spamtime',
  description: 'Shows current spam protection cooldown',
  cooldown: 5,
  async execute(client, message, args) {
    try {
      // Get message cooldown from system settings in Supabase
      const { data: cooldownSettings } = await client.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'message_cooldown')
        .single();
      
      // Default to config or 60 seconds if not found
      const cooldownSeconds = cooldownSettings?.value?.seconds || config.messageCooldown || 60;
      
      // Create embed with spam settings
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('⏱️ Spam Protection')
        .setDescription(`Current spam cooldown is **${cooldownSeconds} seconds**.`)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing spamtime command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error retrieving the spam cooldown settings.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.reply({ embeds: [errorEmbed] });
    }
  }
};