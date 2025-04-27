// commands/buyrole.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'buyrole',
  description: 'Purchase a role with your coins',
  cooldown: 5,
  async execute(client, message, args) {
    try {
      const ROLE_PRICE = 5; // coins needed
      const ROLE_ID = config.premiumRoleId || 'ROLE_ID_HERE'; // Get role ID from config
      
      if (!message.guild) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('This command only works inside a server.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      const role = message.guild.roles.cache.get(ROLE_ID);
      const member = message.guild.members.cache.get(message.author.id);
      
      if (!role) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Role not found. Please contact an administrator.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      if (!member) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Could not find you in this server.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
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
      if (user.coins < ROLE_PRICE) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Insufficient Coins')
          .setDescription(`You need at least **${ROLE_PRICE} coins** to buy this role.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      try {
        // Add the role
        await member.roles.add(role);
        
        // Deduct coins
        await client.db.updateCoins(message.author.id, -ROLE_PRICE);
        
        // Log the action
        await client.db.logAction('role_purchased', message.author.id, { 
          role_id: ROLE_ID,
          role_name: role.name,
          cost: ROLE_PRICE
        });
        
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('✅ Role Purchased')
          .setDescription(`You successfully bought the <@&${ROLE_ID}> role for **${ROLE_PRICE} coins**!`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        await message.channel.send({ embeds: [embed] });
        
        // Log to kryptonite-logs channel
        const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
        if (logChannels.size > 0) {
          const logChannel = logChannels.first();
          const logEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('Role Purchased')
            .setDescription(`${message.author.tag} bought role <@&${ROLE_ID}> for ${ROLE_PRICE} coins.`)
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          logChannel.send({ embeds: [logEmbed] }).catch(console.error);
        }
      } catch (error) {
        console.error('Error assigning role:', error);
        
        // Refund if role assignment fails
        await client.db.updateCoins(message.author.id, ROLE_PRICE);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Failed to assign role. Your coins have been refunded.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        await message.channel.send({ embeds: [errorEmbed] });
      }
    } catch (error) {
      console.error('Error buying role:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error processing your role purchase. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.channel.send({ embeds: [errorEmbed] });
    }
  }
};