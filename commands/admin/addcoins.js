// commands/admin/addcoins.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'addcoins',
  description: 'Adds coins to a user manually',
  async execute(client, message, args) {
    try {
      // Check if user and amount are provided
      if (args.length < 2) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please mention a user and specify an amount. Usage: !addcoins @user <amount>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Extract user from mention
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please mention a valid user. Usage: !addcoins @user <amount>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Parse amount
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please specify a valid positive amount. Usage: !addcoins @user <amount>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Add coins using Supabase
      await client.db.ensureUser(
        targetUser.id,
        targetUser.username,
        targetUser.displayAvatarURL()
      );
      
      const { data, error, newBalance } = await client.db.updateCoins(targetUser.id, amount);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Log the action to Supabase
      await client.db.logAction('admin_add_coins', targetUser.id, {
        admin: message.author.id,
        amount: amount
      });
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Coins Added')
        .setDescription(`Added **${amount}** coins to ${targetUser}. Their new balance is **${newBalance}** coins.`)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [embed] });
      
      // Log the action
      console.log(`✅ Admin ${message.author.tag} added ${amount} coins to ${targetUser.tag}.`);
      
      // Log to kryptonite-logs channel
      const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
      if (logChannels.size > 0) {
        const logChannel = logChannels.first();
        const logEmbed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('Coins Added')
          .setDescription(`${message.author.tag} added ${amount} coins to ${targetUser.tag}.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
    } catch (error) {
      console.error('Error adding coins:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error adding coins. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
};