// commands/admin/massaddcoins.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'massaddcoins',
  description: 'Adds coins to everyone in the server',
  async execute(client, message, args) {
    try {
      // Check if amount is provided
      if (args.length < 1) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please specify an amount. Usage: !massaddcoins <amount>')
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
          .setDescription('Please specify a valid positive amount. Usage: !massaddcoins <amount>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Get all users from Supabase
      const { data: users, error: fetchError } = await client.supabase
        .from('users')
        .select('discord_id');
      
      if (fetchError) {
        throw new Error(`Database error fetching users: ${fetchError.message}`);
      }
      
      // Add coins to each user from the database
      let updatedCount = 0;
      const processedUsers = [];
      
      // First, process all existing users in database
      for (const user of users || []) {
        const { error } = await client.db.updateCoins(user.discord_id, amount);
        if (!error) {
          updatedCount++;
          processedUsers.push(user.discord_id);
        }
      }
      
      // Now, ensure all guild members are in the database and have coins added
      await message.guild.members.fetch();
      
      for (const [memberId, member] of message.guild.members.cache) {
        if (!member.user.bot && !processedUsers.includes(memberId)) {
          // Create user and add coins
          await client.db.ensureUser(
            memberId,
            member.user.username,
            member.user.displayAvatarURL()
          );
          
          const { error } = await client.db.updateCoins(memberId, amount);
          if (!error) {
            updatedCount++;
          }
        }
      }
      
      // Log the action to Supabase
      await client.db.logAction('mass_add_coins', message.author.id, {
        amount: amount,
        users_affected: updatedCount
      });
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Mass Coins Added')
        .setDescription(`Added **${amount}** coins to **${updatedCount}** members in this server.`)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [embed] });
      
      // Log the action
      console.log(`✅ Admin ${message.author.tag} added ${amount} coins to all ${updatedCount} members.`);
      
      // Log to kryptonite-logs channel
      const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
      if (logChannels.size > 0) {
        const logChannel = logChannels.first();
        const logEmbed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('Mass Coins Added')
          .setDescription(`${message.author.tag} added ${amount} coins to all ${updatedCount} members in the server.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
    } catch (error) {
      console.error('Error mass adding coins:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error adding coins to everyone. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
};