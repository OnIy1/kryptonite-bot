const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Show information about the bot'),
  async execute(interaction, client) {
    try {
      const messagesNeeded = config.coinsPerMessages || 10;
      const { data: dailyRewardSetting } = await client.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'daily_reward')
        .single();
      const dailyReward = dailyRewardSetting?.value?.coins || 50;
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('💡 Kryptonite Info')
        .setDescription('Welcome to **Krypton** — your gateway to rewards!')
        .addFields(
          { name: '1️⃣ How to earn coins', value: `• Chat every **${messagesNeeded}** messages = **1 coin**\n• Claim /daily for **${dailyReward}** coins` },
          { name: '2️⃣ How to redeem keys', value: 'Use /buykey to purchase a key' },
          { name: '3️⃣ How roles work', value: 'Use /buyrole to purchase premium roles' }
        )
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Slash info error:', err);
      await interaction.reply({ content: 'Failed to display info.', ephemeral: true });
    }
  }
};
