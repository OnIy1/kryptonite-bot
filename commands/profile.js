// commands/profile.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'profile',
  description: 'Shows your or another user\'s profile',
  cooldown: 5,
  async execute(client, message, args) {
    try {
      const targetUser = message.mentions.users.first() || message.author;
      
      // Ensure user exists in database
      await client.db.ensureUser(
        targetUser.id,
        targetUser.username,
        targetUser.displayAvatarURL()
      );
      
      // Get user data from Supabase
      const { data: userData, error } = await client.db.getUser(targetUser.id);
      
      if (error) {
        throw new Error('Failed to retrieve user data');
      }
      
      // Get message count - if available
      const messages = userData.messages_count || 0;
      
      // Check if user has a key
      const hasKey = userData.key ? '✅ Has Key' : '❌ No Key';
      
      // Calculate user joined time
      const joinedAt = new Date(userData.joined_at);
      const timeSinceJoined = getTimeSince(joinedAt);
      
      // Create user profile embed
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle(`👤 Profile: ${targetUser.username}`)
        .setDescription(`User profile information`)
        .addFields(
          { name: '💰 Coins', value: `${userData.coins}`, inline: true },
          { name: '📝 Messages', value: `${messages}`, inline: true },
          { name: '🔑 Key Status', value: hasKey, inline: true },
          { name: '⏱️ Member For', value: timeSinceJoined, inline: true },
          { name: '🏆 Badges', value: 'Coming Soon...', inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing profile command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error retrieving the user profile.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.reply({ embeds: [errorEmbed] });
    }
  }
};

// Helper function to calculate time since joining
function getTimeSince(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 365) {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
  }
}