// commands/daily.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'daily',
  description: 'Claim your daily reward',
  usage: '!daily',
  cooldown: 5,
  async execute(client, message, args) {
    try {
      // Ensure user exists in database
      await client.db.ensureUser(
        message.author.id,
        message.author.username,
        message.author.displayAvatarURL()
      );
      
      // Try to claim daily reward using Supabase
      const result = await client.db.claimDaily(message.author.id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // If on cooldown
      if (result.cooldown) {
        const embed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('⏰ Daily Reward Cooldown')
          .setDescription(`You've already claimed your daily reward today.\nCome back in **${result.remainingTime}** to claim again.`)
          .setThumbnail('https://i.imgur.com/6YToyEF.png')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.reply({ embeds: [embed] });
      }
      
      // If success
      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🎁 Daily Reward Claimed!')
          .setDescription(`You received **${result.coins}** Krypton Coins!\nYou now have **${result.newBalance}** coins total.`)
          .setThumbnail('https://i.imgur.com/FvQQ0zs.png')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        // Send success message
        return message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error executing daily command:', error);
      
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error processing your daily reward.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.reply({ embeds: [embed] });
    }
  }
};