// commands/coins.js - Updated with better error handling
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'coins',
  description: 'Check your coins balance or another user\'s balance',
  usage: '!coins OR !coins @user',
  cooldown: 3,
  async execute(client, message, args) {
    try {
      // If no user is mentioned, show the author's balance
      if (!message.mentions.users.size) {
        // Ensure user exists in database
        try {
          await client.db.ensureUser(
            message.author.id,
            message.author.username,
            message.author.displayAvatarURL()
          );
        } catch (e) {
          console.error("Error ensuring user exists:", e);
        }
        
        // Get coins from Supabase - with better error handling
        try {
          const { data: user } = await client.db.getUser(message.author.id);
          const coins = user ? user.coins : 0;
          
          const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('💰 Coin Balance')
            .setDescription(`${message.author}, you have **${coins}** Krypton Coins.`)
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          return message.reply({ embeds: [embed] });
        } catch (e) {
          console.error("Error retrieving user data:", e);
          throw new Error('Failed to retrieve coins');
        }
      }
      
      // If a user is mentioned, show their balance
      const targetUser = message.mentions.users.first();
      
      // Get the user from database with better error handling
      try {
        const { data: userData } = await client.db.getUser(targetUser.id);
        
        if (!userData) {
          const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setDescription(`${targetUser.username} hasn't earned any coins yet.`)
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('💰 Coin Balance')
          .setDescription(`${targetUser} has **${userData.coins}** Krypton Coins.`)
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.reply({ embeds: [embed] });
      } catch (e) {
        console.error("Error retrieving target user data:", e);
        
        const embed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setDescription(`${targetUser.username} hasn't earned any coins yet.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error executing coins command:', error);
      
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error checking the coin balance.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.reply({ embeds: [embed] });
    }
  }
};