const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription("Show a user's profile")
    .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(false)),
  async execute(interaction, client) {
    const target = interaction.options.getUser('user') || interaction.user;
    try {
      await client.db.ensureUser(target.id, target.username, target.displayAvatarURL());
      const { data: userData } = await client.db.getUser(target.id);
      if (!userData) throw new Error('No data');
      const messages = userData.messages_count || 0;
      const hasKey = userData.key ? '✅ Has Key' : '❌ No Key';
      const joinedAt = new Date(userData.joined_at);
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle(`👤 Profile: ${target.username}`)
        .addFields(
          { name: '💰 Coins', value: `${userData.coins}`, inline: true },
          { name: '📝 Messages', value: `${messages}`, inline: true },
          { name: '🔑 Key Status', value: hasKey, inline: true },
          { name: '⏱️ Member For', value: getTimeSince(joinedAt), inline: true },
          { name: '🏆 Badges', value: 'Coming Soon...', inline: false }
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Slash profile error:', err);
      await interaction.reply({ content: 'Failed to fetch profile.', ephemeral: true });
    }
  }
};
