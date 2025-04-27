// commands/info.js - Updated to use Supabase
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'info',
  description: 'Shows information about the bot',
  cooldown: 5,
  async execute(client, message, args) {
    try {
      // Get message reward settings
      const messagesNeeded = config.coinsPerMessages || 10;
      
      // Get system settings from Supabase
      const { data: dailyRewardSetting } = await client.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'daily_reward')
        .single();
        
      const dailyReward = dailyRewardSetting?.value?.coins || 50;
      
      // Create embed with bot info
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('💡 Kryptonite Info')
        .setDescription('Welcome to **Kryptonite** — your gateway to rewards through activity and loyalty!')
        .addFields(
          {
            name: '1️⃣ How to earn coins',
            value: `• Chat actively — every **${messagesNeeded}** messages = **1 coin**\n• Claim your daily reward of **${dailyReward}** coins with \`!daily\`\n• Watch for events like x2 coins boost`
          },
          {
            name: '2️⃣ How to redeem keys',
            value: `• Save coins and use \`!buykey\` to purchase a key\n• Your key will be sent privately in DMs`
          },
          {
            name: '3️⃣ How roles work',
            value: `• Use \`!buyrole\` to purchase premium server roles with your coins`
          }
        )
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing info command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error')
        .setDescription('There was an error displaying the information.')
        .setFooter({ text: 'Krypton Executor' })
        .setTimestamp();
        
      return message.reply({ embeds: [errorEmbed] });
    }
  }
};