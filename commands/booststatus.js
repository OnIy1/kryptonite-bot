// commands/booststatus.js - User-accessible boost status with Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'booststatus-user',
  description: 'Shows if a boost is active and when it ends',
  async execute(client, message, args) {
    try {
      // Check if boost is active and not expired
      if (!client.boostSystem.active || !client.boostSystem.endTime || client.boostSystem.endTime <= Date.now()) {
        // Double check from Supabase in case the bot was restarted
        const { data } = await client.supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'boost_system')
          .single();
        
        // If found in DB and active, update client
        if (data && data.value && data.value.active && data.value.endTime > Date.now()) {
          client.boostSystem = data.value;
        } else {
          const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Boost Status')
            .setDescription('There is no active coin boost at the moment.')
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          return message.channel.send({ embeds: [embed] });
        }
      }
      
      // Calculate remaining time
      const remainingTime = client.boostSystem.endTime - Date.now();
      const minutes = Math.floor(remainingTime / (60 * 1000));
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      let timeDisplay = '';
      if (hours > 0) {
        timeDisplay += `${hours} hour${hours !== 1 ? 's' : ''}`;
        if (mins > 0) {
          timeDisplay += ` and ${mins} minute${mins !== 1 ? 's' : ''}`;
        }
      } else {
        timeDisplay = `${mins} minute${mins !== 1 ? 's' : ''}`;
      }
      
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🚀 Boost Status')
        .setDescription(`A ${client.boostSystem.multiplier}x coin boost is currently active!\n\nTime remaining: **${timeDisplay}**`)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error checking boost status:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error checking the boost status. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
};