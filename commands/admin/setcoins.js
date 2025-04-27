// commands/admin/setcoins.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'setcoins',
  description: 'Sets a user\'s coin balance manually',
  async execute(client, message, args) {
    try {
      // Check if user and amount are provided
      if (args.length < 2) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please mention a user and specify an amount. Usage: !setcoins @user <amount>')
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
          .setDescription('Please mention a valid user. Usage: !setcoins @user <amount>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Parse amount
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount < 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please specify a valid non-negative amount. Usage: !setcoins @user <amount>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Ensure user exists in database
      await client.db.ensureUser(
        targetUser.id,
        targetUser.username,
        targetUser.displayAvatarURL()
      );
      
      // Set coins using Supabase
      const { data, error } = await client.db.setCoins(targetUser.id, amount);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Log the action to Supabase
      await client.db.logAction('admin_set_coins', targetUser.id, {
        admin: message.author.id,
        amount: amount
      });
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Coins Updated')
        .setDescription(`Set ${targetUser}'s coin balance to **${amount}** coins.`)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [embed] });
      
      // Log the action
      console.log(`✅ Admin ${message.author.tag} set ${targetUser.tag}'s coins to ${amount}.`);
      
      // Log to kryptonite-logs channel
      const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
      if (logChannels.size > 0) {
        const logChannel = logChannels.first();
        const logEmbed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('Coins Set')
          .setDescription(`${message.author.tag} set ${targetUser.tag}'s coin balance to ${amount}.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
    } catch (error) {
      console.error('Error setting coins:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error setting coins. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
};