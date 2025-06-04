const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buyrole')
    .setDescription('Purchase the premium role'),
  async execute(interaction, client) {
    const ROLE_PRICE = 5;
    const ROLE_ID = config.premiumRoleId || 'ROLE_ID_HERE';
    if (!interaction.guild) return interaction.reply({ content: 'Run this in a server.', ephemeral: true });
    try {
      const role = interaction.guild.roles.cache.get(ROLE_ID);
      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (!role || !member) return interaction.reply({ content: 'Role or member missing.', ephemeral: true });
      await client.db.ensureUser(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
      const { data: user } = await client.db.getUser(interaction.user.id);
      if (user.coins < ROLE_PRICE) {
        const e = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Insufficient Coins')
          .setDescription(`You need **${ROLE_PRICE} coins** to buy this role.`);
        return interaction.reply({ embeds: [e], ephemeral: true });
      }
      await member.roles.add(role);
      await client.db.updateCoins(interaction.user.id, -ROLE_PRICE);
      await client.db.logAction('role_purchased', interaction.user.id, { role_id: ROLE_ID, cost: ROLE_PRICE });
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Role Purchased')
        .setDescription(`You bought <@&${ROLE_ID}> for **${ROLE_PRICE} coins**!`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error('Slash buyrole error:', err);
      await client.db.updateCoins(interaction.user.id, ROLE_PRICE);
      await interaction.reply({ content: 'Failed to assign role.', ephemeral: true });
    }
  }
};
