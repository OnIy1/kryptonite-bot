// commands/top.js - Updated to use Supabase
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  name: 'top',
  description: 'Shows a leaderboard of richest users',
  cooldown: 10,
  async execute(client, message, args) {
    try {
      // Constants for pagination
      const USERS_PER_PAGE = 10;
      let currentPage = 1;
      
      // Function to fetch and generate page content
      async function generatePage(pageNum) {
        // Calculate pagination
        const startIdx = (pageNum - 1) * USERS_PER_PAGE;
        
        // Fetch leaderboard data from Supabase
        const { data: totalCount } = await client.supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
          
        const TOTAL_PAGES = Math.ceil(totalCount / USERS_PER_PAGE);
        
        // Get sorted users for the current page
        const { data: users, error } = await client.supabase
          .from('users')
          .select('discord_id, username, coins, avatar_url')
          .order('coins', { ascending: false })
          .range(startIdx, startIdx + USERS_PER_PAGE - 1);
          
        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        if (!users || users.length === 0) {
          const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🏆 Coin Leaderboard')
            .setDescription('No users have earned coins yet!')
            .setFooter({ text: 'Krypton Executor' })
            .setTimestamp();
            
          return { embed, totalPages: 1 };
        }
        
        // Build leaderboard text
        let leaderboardText = '';
        
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          const position = startIdx + i + 1; // Absolute position in the leaderboard
          
          // Format the leaderboard entry
          leaderboardText += `**${position}.** ${user.username}: **${user.coins}** coins\n`;
        }
        
        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🏆 Coin Leaderboard')
          .setDescription(leaderboardText)
          .addFields(
            {
              name: 'Page',
              value: `${pageNum}/${TOTAL_PAGES || 1} (${totalCount || users.length} users total)`,
              inline: true
            }
          )
          .setFooter({ text: 'Krypton Executor' })
          .setTimestamp();
          
        return { embed, totalPages: TOTAL_PAGES || 1 };
      }
      
      // Generate button row
      function getButtonRow(currentPage, totalPages) {
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('first')
              .setLabel('⏪ First')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId('previous')
              .setLabel('◀️ Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next ▶️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === totalPages),
            new ButtonBuilder()
              .setCustomId('last')
              .setLabel('Last ⏭️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === totalPages)
          );
          
        return row;
      }
      
      // Send the initial embed with buttons
      const { embed: initialEmbed, totalPages } = await generatePage(currentPage);
      const initialRow = getButtonRow(currentPage, totalPages);
      
      const reply = await message.channel.send({
        embeds: [initialEmbed],
        components: [initialRow]
      });
      
      // Create a collector for button interactions
      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 2 * 60 * 1000 // 2 minutes timeout
      });
      
      // Handle button clicks
      collector.on('collect', async interaction => {
        // Make sure the button was clicked by the command invoker
        if (interaction.user.id !== message.author.id) {
          await interaction.reply({
            content: 'This leaderboard is not for you! Use the `!top` command to get your own.',
            ephemeral: true
          });
          return;
        }
        
        // Handle page navigation
        switch (interaction.customId) {
          case 'first':
            currentPage = 1;
            break;
          case 'previous':
            currentPage = Math.max(1, currentPage - 1);
            break;
          case 'next':
            currentPage = Math.min(totalPages, currentPage + 1);
            break;
          case 'last':
            currentPage = totalPages;
            break;
        }
        
        // Update the message with the new page
        const { embed: newEmbed, totalPages: newTotalPages } = await generatePage(currentPage);
        const newRow = getButtonRow(currentPage, newTotalPages);
        
        await interaction.update({
          embeds: [newEmbed],
          components: [newRow]
        });
      });
      
      // When the collector expires, remove the buttons
      collector.on('end', async () => {
        try {
          // Update message to remove buttons after timeout
          const { embed: finalEmbed } = await generatePage(currentPage);
          await reply.edit({
            embeds: [finalEmbed],
            components: []
          });
        } catch (error) {
          // Silently fail if message was deleted or unavailable
          console.log('Failed to remove buttons after leaderboard timeout');
        }
      });
    } catch (error) {
      console.error('Error generating leaderboard:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error generating the leaderboard. Please try again later.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
};