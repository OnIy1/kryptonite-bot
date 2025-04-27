// commands/admin/booststart.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'booststart',
  description: 'Starts a double-coin (or more) boost for X time',
  async execute(client, message, args) {
    try {
      // Check if multiplier and duration are provided
      if (args.length < 2) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please specify a multiplier and duration. Usage: !booststart <multiplier> <duration_in_minutes>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Parse multiplier
      const multiplier = parseFloat(args[0]);
      if (isNaN(multiplier) || multiplier <= 1) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please specify a valid multiplier greater than 1. Usage: !booststart <multiplier> <duration_in_minutes>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Parse duration (in minutes)
      const duration = parseInt(args[1]);
      if (isNaN(duration) || duration <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Error')
          .setDescription('Please specify a valid duration in minutes greater than 0. Usage: !booststart <multiplier> <duration_in_minutes>')
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return message.channel.send({ embeds: [errorEmbed] });
      }
      
      // Calculate end time
      const endTime = Date.now() + (duration * 60 * 1000);
      
      // Set boost system
      client.boostSystem = {
        active: true,
        multiplier: multiplier,
        endTime: endTime
      };
      
      // Store in Supabase for persistence
      await client.supabase
        .from('system_settings')
        .upsert([
          {
            key: 'boost_system',
            value: {
              active: true,
              multiplier: multiplier,
              endTime: endTime
            }
          }
        ]);
      
      // Format time for display
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      let timeDisplay = '';
      
      if (hours > 0) {
        timeDisplay += `${hours} hour${hours !== 1 ? 's' : ''}`;
        if (minutes > 0) {
          timeDisplay += ` and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
      } else {
        timeDisplay = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }
      
      // Log the action to Supabase
      await client.db.logAction('boost_start', message.author.id, {
        multiplier: multiplier,
        duration: duration,
        end_time: endTime
      });
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Coin Boost Activated')
        .setDescription(`Activated a ${multiplier}x coin boost for ${timeDisplay}! All users will earn ${multiplier} times more coins than usual.`)
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [embed] });
      
      // Log the action
      console.log(`✅ Admin ${message.author.tag} started a x${multiplier} coin boost for ${duration} minutes.`);
      
      // Log to kryptonite-logs channel
      const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
      if (logChannels.size > 0) {
        const logChannel = logChannels.first();
        const logEmbed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('Boost Started')
          .setDescription(`${message.author.tag} started a ${multiplier}x coin boost for ${timeDisplay}.`)
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
      
      // Set a timeout to deactivate the boost when it expires
      setTimeout(async () => {
        if (client.boostSystem.active) {
          client.boostSystem = {
            active: false,
            multiplier: 1,
            endTime: null
          };
          
          // Update Supabase
          await client.supabase
            .from('system_settings')
            .upsert([
              {
                key: 'boost_system',
                value: {
                  active: false,
                  multiplier: 1,
                  endTime: null
                }
              }
            ]);
          
          // Log boost end to Supabase
          await client.db.logAction('boost_end', 'system', {
            multiplier: multiplier
          });
          
          // Notify about boost end in log channel
          if (logChannels.size > 0) {
            const logChannel = logChannels.first();
            const endEmbed = new EmbedBuilder()
              .setColor('#3498db')
              .setTitle('Boost Ended')
              .setDescription(`The ${multiplier}x coin boost has ended.`)
              .setFooter({ text: 'Krypton Executor' })
              .setTimestamp();
              
            logChannel.send({ embeds: [endEmbed] }).catch(console.error);
          }
          
          console.log(`✅ The x${multiplier} coin boost has ended.`);
        }
      }, duration * 60 * 1000);
    } catch (error) {
      console.error('Error starting boost:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error starting the boost. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
};