// commands/buykey.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'buykey',
  description: 'Purchase a key with your coins',
  cooldown: 5,
  async execute(client, message, args) {
    try {
      const KEY_PRICE = 10; // coins needed
      
      // Ensure user exists in database
      await client.db.ensureUser(
        message.author.id,
        message.author.username,
        message.author.displayAvatarURL()
      );
      
      // Get user coins
      const { data: user, error: userError } = await client.db.getUser(message.author.id);
      
      if (userError) {
        throw new Error('Failed to retrieve user data');
      }
      
      // Check if user has enough coins
      if (user.coins < KEY_PRICE) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Insufficient Coins')
          .setDescription(`You need at least **${KEY_PRICE} coins** to buy a key.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Generate a unique key
      const { data, error: keyError, key } = await client.db.generateKey(message.author.id);
      
      if (keyError) {
        throw new Error('Error generating key');
      }
      
      // Deduct coins
      await client.db.updateCoins(message.author.id, -KEY_PRICE);
      
      // Log the action
      await client.db.logAction('key_purchased', message.author.id, { cost: KEY_PRICE });
      
      try {
        // Send the key in a DM for privacy
        const dmEmbed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🔑 Your Krypton Executor Key')
          .setDescription(`Here's your key:\n\`${key}\`\n\nKeep this private and don't share it with anyone!`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        await message.author.send({ embeds: [dmEmbed] });
        
        // Confirm in the channel
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('✅ Key Purchased')
          .setDescription('You successfully bought a key! Check your DMs for your key.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        await message.channel.send({ embeds: [embed] });
        
        // Log to kryptonite-logs channel
        const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
        if (logChannels.size > 0) {
          const logChannel = logChannels.first();
          const logEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Key Purchased')
            .setDescription(`${message.author.tag} bought a key for ${KEY_PRICE} coins.`)
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          logChannel.send({ embeds: [logEmbed] }).catch(console.error);
        }
      } catch (err) {
        console.error(`❌ Could not DM key to ${message.author.username}`, err);
        
        // Refund the coins since DM failed
        await client.db.updateCoins(message.author.id, KEY_PRICE);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Failed to DM you. Make sure your DMs are open. Your coins have been refunded.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        await message.channel.send({ embeds: [errorEmbed] });
      }
    } catch (error) {
      console.error('Error buying key:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error processing your key purchase. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.channel.send({ embeds: [errorEmbed] });
    }
  }
};