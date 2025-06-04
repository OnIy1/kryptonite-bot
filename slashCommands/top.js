const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Show the richest users leaderboard'),
  async execute(interaction, client) {
    const USERS_PER_PAGE = 10;
    let currentPage = 1;
    async function generatePage(pageNum) {
      const startIdx = (pageNum - 1) * USERS_PER_PAGE;
      const { count } = await client.supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      const TOTAL_PAGES = Math.ceil((count || 0) / USERS_PER_PAGE);
      const { data: users, error } = await client.supabase
        .from('users')
        .select('discord_id, username, coins')
        .order('coins', { ascending: false })
        .range(startIdx, startIdx + USERS_PER_PAGE - 1);
      if (error) throw new Error(error.message);
      if (!users || users.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🏆 Coin Leaderboard')
          .setDescription('No users have earned coins yet!');
        return { embed, totalPages: 1 };
      }
      let leaderboardText = '';
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const position = startIdx + i + 1;
        leaderboardText += `**${position}.** ${user.username}: **${user.coins}** coins\n`;
      }
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🏆 Coin Leaderboard')
        .setDescription(leaderboardText)
        .addFields({ name: 'Page', value: `${pageNum}/${TOTAL_PAGES || 1} (${count || users.length} users total)`, inline: true });
      return { embed, totalPages: TOTAL_PAGES || 1 };
    }
    function getButtonRow(page, total) {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('first').setLabel('⏪ First').setStyle(ButtonStyle.Primary).setDisabled(page === 1),
        new ButtonBuilder().setCustomId('previous').setLabel('◀️ Previous').setStyle(ButtonStyle.Primary).setDisabled(page === 1),
        new ButtonBuilder().setCustomId('next').setLabel('Next ▶️').setStyle(ButtonStyle.Primary).setDisabled(page === total),
        new ButtonBuilder().setCustomId('last').setLabel('Last ⏭️').setStyle(ButtonStyle.Primary).setDisabled(page === total)
      );
    }
    try {
      const { embed: initialEmbed, totalPages } = await generatePage(currentPage);
      const reply = await interaction.reply({ embeds: [initialEmbed], components: [getButtonRow(currentPage, totalPages)], ephemeral: false, fetchReply: true });
      const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 2 * 60 * 1000 });
      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: 'This leaderboard is not for you!', ephemeral: true });
        }
        switch (i.customId) {
          case 'first': currentPage = 1; break;
          case 'previous': currentPage = Math.max(1, currentPage - 1); break;
          case 'next': currentPage = Math.min(totalPages, currentPage + 1); break;
          case 'last': currentPage = totalPages; break;
        }
        const { embed, totalPages: newTotal } = await generatePage(currentPage);
        await i.update({ embeds: [embed], components: [getButtonRow(currentPage, newTotal)] });
      });
      collector.on('end', async () => {
        try {
          const { embed } = await generatePage(currentPage);
          await reply.edit({ embeds: [embed], components: [] });
        } catch (_) {}
      });
    } catch (err) {
      console.error('Slash top error:', err);
      await interaction.reply({ content: 'Failed to generate leaderboard.', ephemeral: true });
    }
  }
};
