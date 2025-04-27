// commands/admin/clearcoins.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'clearcoins',
  description: 'Resets everyone\'s coins to 0',
  ownerOnly: true,
  async execute(client, message, args) {
    try {
      // Confirmation message
      const confirmEmbed = new EmbedBuilder()
        .setColor('#f39c12')
        .setTitle('⚠️ Confirm Clear Coins')
        .setDescription('Are you sure you want to reset **everyone\'s** coins to 0? This action cannot be undone.\n\nReply with `yes` to confirm or `no` to cancel.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [confirmEmbed] });
      
      // Create a filter for the collector
      const filter = m => m.author.id === message.author.id && (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'no');
      
      // Create a message collector
      const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
      
      collector.on('collect', async m => {
        if (m.content.toLowerCase() === 'yes') {
          // User confirmed, proceed with clearing coins
          
          // Get all users from Supabase
          const { data: users, error: fetchError } = await client.supabase
            .from('users')
            .select('discord_id');
          
          if (fetchError) {
            throw new Error(`Database error fetching users: ${fetchError.message}`);
          }
          
          // Reset all users' coins to 0
          let updatedCount = 0;
          
          for (const user of users || []) {
            const { error } = await client.db.setCoins(user.discord_id, 0);
            if (!error) {
              updatedCount++;
            }
          }
          
          // Log the action to Supabase
          await client.db.logAction('clear_all_coins', message.author.id, {
            users_affected: updatedCount
          });
          
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ Coins Cleared')
            .setDescription(`Reset coin balances to 0 for **${updatedCount}** users.`)
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          message.channel.send({ embeds: [embed] });
          
          // Log the action
          console.log(`✅ Admin ${message.author.tag} cleared all coin balances.`);
          
          // Log to kryptonite-logs channel
          const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
          if (logChannels.size > 0) {
            const logChannel = logChannels.first();
            const logEmbed = new EmbedBuilder()
              .setColor('#3498db')
              .setTitle('Coins Cleared')
              .setDescription(`${message.author.tag} reset all coin balances to 0.`)
              .setFooter({ text: 'Krypton Executor' })
              .setTimestamp();
              
            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
          }
        } else {
          // User cancelled
          const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Action Cancelled')
            .setDescription('Coin clear operation cancelled.')
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          message.channel.send({ embeds: [embed] });
        }
      });
      
      collector.on('end', collected => {
        if (collected.size === 0) {
          // Timeout - no response received
          const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Action Cancelled')
            .setDescription('Coin clear operation cancelled due to timeout.')
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          message.channel.send({ embeds: [embed] });
        }
      });
    } catch (error) {
      console.error('Error clearing coins:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error clearing coins. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
};