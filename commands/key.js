// commands/key.js - Key generation command using Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'key',
  description: 'Generate or view your Krypton Executor key',
  usage: '!key',
  cooldown: 5,
  async execute(client, message, args) {
    try {
      // Ensure user exists in database
      await client.db.ensureUser(
        message.author.id,
        message.author.username,
        message.author.displayAvatarURL()
      );
      
      // Get user data
      const { data: user, error } = await client.db.getUser(message.author.id);
      
      if (error) {
        throw new Error('Failed to retrieve user data');
      }
      
      // Check if user is banned
      if (user.is_banned) {
        const embed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Access Denied')
          .setDescription(`You are banned from using Krypton Executor.\n${user.ban_reason ? `Reason: ${user.ban_reason}` : ''}`)
          .setFooter({ text: 'Contact an administrator for help' })
          .setTimestamp();
          
        return message.reply({ embeds: [embed] });
      }
      
      // Check if user already has a key
      if (user.key) {
        // Send the key in a DM for privacy
        try {
          const dmEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🔑 Your Krypton Executor Key')
            .setDescription(`Here's your key:\n\`${user.key}\`\n\nKeep this private and don't share it with anyone!`)
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          await message.author.send({ embeds: [dmEmbed] });
            
          // Confirm in the channel
          const channelEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🔒 Key Sent')
            .setDescription('I\'ve sent your Krypton Executor key via DM!')
            .setFooter({ text: 'Check your private messages' })
            .setTimestamp();
            
          return message.reply({ embeds: [channelEmbed] });
        } catch (err) {
          return message.reply('I couldn\'t send you a DM. Please enable direct messages from server members and try again.');
        }
      }
      
      // Generate a new key (requires at least 100 coins)
      if (user.coins < 100) {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('⚠️ Insufficient Coins')
          .setDescription(`You need at least 100 coins to generate a key.\nYou currently have **${user.coins}** coins.\n\nUse \`!daily\` to earn more coins!`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.reply({ embeds: [embed] });
      }
      
      // Generate key and deduct coins
      const { data, error: keyError, key } = await client.db.generateKey(message.author.id);
      if (keyError) {
        throw new Error('Failed to generate key');
      }
      
      // Deduct coins
      await client.db.updateCoins(message.author.id, -100);
      
      // Log the action
      await client.db.logAction('key_generated', message.author.id, { cost: 100 });
      
      // Send the key in a DM for privacy
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🔑 Your New Krypton Executor Key')
          .setDescription(`Here's your key:\n\`${key}\`\n\nKeep this private and don't share it with anyone!\n\n**100 coins** have been deducted from your balance.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        await message.author.send({ embeds: [dmEmbed] });
          
        // Confirm in the channel
        const channelEmbed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🔒 Key Generated!')
          .setDescription('I\'ve sent your new Krypton Executor key via DM!\n\n**100 coins** have been deducted from your balance.')
          .setFooter({ text: 'Check your private messages' })
          .setTimestamp();
          
        return message.reply({ embeds: [channelEmbed] });
      } catch (err) {
        return message.reply(`Error sending DM. Your key is: \`${key}\` (100 coins have been deducted)`);
      }
    } catch (error) {
      console.error('Error executing key command:', error);
      
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error generating your key.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.reply({ embeds: [embed] });
    }
  }
};