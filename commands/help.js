// commands/help.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'help',
  description: 'Shows all available user commands',
  cooldown: 5,
  async execute(client, message, args) {
    try {
      // Build commands list
      const commandFields = [
        { name: `${config.prefix}help`, value: 'Shows all available user commands' },
        { name: `${config.prefix}coins`, value: 'Shows your current coin balance' },
        { name: `${config.prefix}daily`, value: 'Claims daily reward if 24h have passed' },
        { name: `${config.prefix}top`, value: 'Shows a leaderboard of richest users' },
        { name: `${config.prefix}profile`, value: 'Shows your or another user\'s profile' },
        { name: `${config.prefix}shop`, value: 'Shows items available for purchase' },
        { name: `${config.prefix}buykey`, value: 'Purchase a key with your coins' },
        { name: `${config.prefix}buyrole`, value: 'Purchase a role with your coins' },
        { name: `${config.prefix}key`, value: 'View or generate your execution key' },
        { name: `${config.prefix}info`, value: 'Shows information about the bot' },
        { name: `${config.prefix}spamtime`, value: 'Shows current spam protection cooldown' }
      ];
      
      // Create commands embed
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('Krypton Bot Commands')
        .setDescription('List of available commands:')
        .addFields(commandFields)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [embed] });
      
      // Check if user is admin (owner or trusted)
      const ownerId = config.ownerId;
      const isOwner = message.author.id === ownerId;
      
      // Check if user is trusted using Supabase
      const isTrusted = await client.db.isTrusted(message.author.id);
      const isAdmin = isOwner || isTrusted;
      
      // If admin, add a note about admin commands
      if (isAdmin) {
        const noteEmbed = new EmbedBuilder()
          .setColor('#f39c12')
          .setTitle('Admin Note')
          .setDescription(`As an admin, you can use \`${config.prefix}ahelp\` to see admin commands.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        // Send this as a DM to avoid cluttering the channel
        try {
          await message.author.send({ embeds: [noteEmbed] });
        } catch (error) {
          // If DM fails, send as a separate message that auto-deletes after 10 seconds
          message.channel.send({ embeds: [noteEmbed] })
            .then(msg => {
              setTimeout(() => msg.delete().catch(() => {}), 10000);
            });
        }
      }
    } catch (error) {
      console.error('Error executing help command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error displaying the help menu.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.reply({ embeds: [errorEmbed] });
    }
  }
};