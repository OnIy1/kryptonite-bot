// handlers/embedBuilder.js
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

// Default colors for embeds
const COLORS = {
  DEFAULT: '#9b59b6',  // Purple color for Krypton
  ERROR: '#e74c3c',    // Red for errors
  SUCCESS: '#2ecc71',  // Green for success
  WARNING: '#f39c12',  // Orange/yellow for warnings
  INFO: '#3498db'      // Blue for information
};

module.exports = {
  createEmbed: (title, description, client, fields = []) => {
    // Use default color if not specified in config
    const embedColor = config.embedColor || COLORS.DEFAULT;
    
    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
    
    // Add the bot name to footer if client is provided
    if (client && client.user) {
      embed.setFooter({ text: 'Krypton Executor', iconURL: client.user.displayAvatarURL() });
    } else {
      embed.setFooter({ text: 'Krypton Executor' });
    }
    
    // Add any fields if provided
    if (fields.length > 0) {
      fields.forEach(field => {
        embed.addFields({ name: field.name, value: field.value, inline: field.inline || false });
      });
    }
    
    return embed;
  },
  
  createErrorEmbed: (errorMessage, client) => {
    const embed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle('❌ Error')
      .setDescription(errorMessage)
      .setTimestamp();
      
    // Add the bot name to footer if client is provided
    if (client && client.user) {
      embed.setFooter({ text: 'Krypton Executor', iconURL: client.user.displayAvatarURL() });
    } else {
      embed.setFooter({ text: 'Krypton Executor' });
    }
    
    return embed;
  },
  
  createSuccessEmbed: (message, client) => {
    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('✅ Success')
      .setDescription(message)
      .setTimestamp();
      
    // Add the bot name to footer if client is provided
    if (client && client.user) {
      embed.setFooter({ text: 'Krypton Executor', iconURL: client.user.displayAvatarURL() });
    } else {
      embed.setFooter({ text: 'Krypton Executor' });
    }
    
    return embed;
  },
  
  createWarningEmbed: (message, client) => {
    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('⚠️ Warning')
      .setDescription(message)
      .setTimestamp();
      
    // Add the bot name to footer if client is provided
    if (client && client.user) {
      embed.setFooter({ text: 'Krypton Executor', iconURL: client.user.displayAvatarURL() });
    } else {
      embed.setFooter({ text: 'Krypton Executor' });
    }
    
    return embed;
  },
  
  createInfoEmbed: (message, client) => {
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle('ℹ️ Information')
      .setDescription(message)
      .setTimestamp();
      
    // Add the bot name to footer if client is provided
    if (client && client.user) {
      embed.setFooter({ text: 'Krypton Executor', iconURL: client.user.displayAvatarURL() });
    } else {
      embed.setFooter({ text: 'Krypton Executor' });
    }
    
    return embed;
  }
};