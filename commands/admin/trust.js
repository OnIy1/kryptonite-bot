// commands/admin/trust.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'trust',
  description: 'Manages trusted users',
  ownerOnly: true,
  async execute(client, message, args) {
    // Only the bot owner can manage trust
    if (message.author.id !== config.ownerId) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Access Denied')
        .setDescription('Only the bot owner can manage trusted users.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.channel.send({ embeds: [errorEmbed] });
    }

    const subCommand = args[0];
    const mentionedUser = message.mentions.users.first();

    if (!subCommand || !mentionedUser) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Invalid Usage')
        .setDescription('Usage:\n• `!trust add @user` to add\n• `!trust remove @user` to remove\n• `!trust list` to see all trusted users')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.channel.send({ embeds: [errorEmbed] });
    }

    // Supabase table "trusted_users" with discord_id, username, added_at
    
    if (subCommand === 'add') {
      // Check if user is already trusted
      const { data: existingTrust, error: checkError } = await client.supabase
        .from('trusted_users')
        .select('*')
        .eq('discord_id', mentionedUser.id)
        .single();
        
      if (existingTrust) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Already Trusted')
          .setDescription(`${mentionedUser.username} is already in the trusted list.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Add user to trusted list
      const { error: addError } = await client.supabase
        .from('trusted_users')
        .insert([
          {
            discord_id: mentionedUser.id,
            username: mentionedUser.username,
            added_at: new Date().toISOString(),
            added_by: message.author.id
          }
        ]);
        
      if (addError) {
        console.error('Error adding trusted user:', addError);
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Database Error')
          .setDescription('There was an error adding the trusted user. Please try again later.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Log the action
      await client.db.logAction('trust_added', mentionedUser.id, {
        admin: message.author.id
      });
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Trust Added')
        .setDescription(`Added ${mentionedUser.username} to the trusted admin list.`)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [embed] });
      
      // Log the action
      console.log(`✅ Bot owner ${message.author.tag} added ${mentionedUser.tag} to the trusted list.`);
      
      // Log to kryptonite-logs channel
      const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
      if (logChannels.size > 0) {
        const logChannel = logChannels.first();
        const logEmbed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('Trust Added')
          .setDescription(`${message.author.tag} added ${mentionedUser.tag} to the trusted admin list.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
    } else if (subCommand === 'remove') {
      // Check if user is trusted
      const { data: existingTrust, error: checkError } = await client.supabase
        .from('trusted_users')
        .select('*')
        .eq('discord_id', mentionedUser.id)
        .single();
        
      if (!existingTrust) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Not Trusted')
          .setDescription(`${mentionedUser.username} is not in the trusted list.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Remove user from trusted list
      const { error: removeError } = await client.supabase
        .from('trusted_users')
        .delete()
        .eq('discord_id', mentionedUser.id);
        
      if (removeError) {
        console.error('Error removing trusted user:', removeError);
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Database Error')
          .setDescription('There was an error removing the trusted user. Please try again later.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Log the action
      await client.db.logAction('trust_removed', mentionedUser.id, {
        admin: message.author.id
      });
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Trust Removed')
        .setDescription(`Removed ${mentionedUser.username} from the trusted admin list.`)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [embed] });
      
      // Log the action
      console.log(`✅ Bot owner ${message.author.tag} removed ${mentionedUser.tag} from the trusted list.`);
      
      // Log to kryptonite-logs channel
      const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
      if (logChannels.size > 0) {
        const logChannel = logChannels.first();
        const logEmbed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('Trust Removed')
          .setDescription(`${message.author.tag} removed ${mentionedUser.tag} from the trusted admin list.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
    } else if (subCommand === 'list') {
      // List all trusted users
      const { data: trustedUsers, error: listError } = await client.supabase
        .from('trusted_users')
        .select('*');
        
      if (listError) {
        console.error('Error listing trusted users:', listError);
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Database Error')
          .setDescription('There was an error fetching the trusted users. Please try again later.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      if (!trustedUsers || trustedUsers.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('👑 Trusted Users')
          .setDescription('There are no trusted users yet.')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [embed] });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('👑 Trusted Users')
        .setDescription(trustedUsers.map(user => `• **${user.username}** (${user.discord_id})`).join('\n'))
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.channel.send({ embeds: [embed] });
    } else {
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Invalid Subcommand')
        .setDescription('Valid subcommands: `add`, `remove`, `list`')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.channel.send({ embeds: [errorEmbed] });
    }
  }
};