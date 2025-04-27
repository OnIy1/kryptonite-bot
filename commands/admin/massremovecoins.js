// commands/admin/massremovecoins.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'massremovecoins',
  description: 'Removes coins from everyone in the server',
  async execute(client, message, args) {
    try {
      // Check if amount is provided
      if (args.length < 1) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please specify an amount. Usage: !massremovecoins <amount>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Parse amount
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please specify a valid positive amount. Usage: !massremovecoins <amount>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Get all users from Supabase
      const { data: users, error: fetchError } = await client.supabase
        .from('users')
        .select('discord_id, coins')
        .gt('coins', 0); // Only get users with coins > 0
      
      if (fetchError) {
        throw new Error(`Database error fetching users: ${fetchError.message}`);
      }
      
      // Remove coins from each user that has coins
      let updatedCount = 0;
      
      // Process users with coins
      for (const user of users || []) {
        // Remove coins (negative amount)
        const { error } = await client.db.updateCoins(user.discord_id, -Math.min(amount, user.coins));
        if (!error) {
          updatedCount++;
        }
      }
      
      // Log the action to Supabase
      await client.db.logAction('mass_remove_coins', message.author.id, {
        amount: amount,
        users_affected: updatedCount
      });
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Mass Coins Removed')
        .setDescription(`Removed up to **${amount}** coins from **${updatedCount}** members in this server.`)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [embed] });
      
      // Log the action
      console.log(`✅ Admin ${message.author.tag} removed ${amount} coins from ${updatedCount} members.`);
      
      // Log to kryptonite-logs channel
      const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
      if (logChannels.size > 0) {
        const logChannel = logChannels.first();
        const logEmbed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('Mass Coins Removed')
          .setDescription(`${message.author.tag} removed up to ${amount} coins from ${updatedCount} members in the server.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
    } catch (error) {
      console.error('Error mass removing coins:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error removing coins from everyone. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
};