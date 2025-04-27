const embedBuilder = require('../../handlers/embedBuilder');
const { exec } = require('child_process');

module.exports = {
  name: 'restart',
  description: 'Restarts the bot via PM2',
  ownerOnly: true,
  execute(client, message, args) {
    try {
      // Send confirmation message
      const embed = embedBuilder.createEmbed(
        'Restarting Bot',
        'The bot is restarting. Please wait a moment...',
        client
      );
      message.channel.send({ embeds: [embed] });
      
      // Log the action
      console.log(`✅ Admin ${message.author.tag} initiated a bot restart.`);
      
      // Log to kryptonite-logs channel
      const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
      if (logChannels.size > 0) {
        const logChannel = logChannels.first();
        const logEmbed = embedBuilder.createEmbed(
          'Bot Restarting',
          `${message.author.tag} initiated a bot restart.`,
          client
        );
        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
      
      // Give some time for the messages to be sent before restarting
      setTimeout(() => {
        // Try to restart using PM2
        exec('pm2 restart kryptonite-bot', (error, stdout, stderr) => {
          if (error) {
            console.error(`Error restarting bot: ${error}`);
            // If PM2 fails, exit the process and let the process manager restart it
            process.exit(1);
          }
        });
      }, 1000);
    } catch (error) {
      console.error('Error restarting bot:', error);
      const errorEmbed = embedBuilder.createErrorEmbed(
        'There was an error restarting the bot. Please try manually.',
        client
      );
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
};