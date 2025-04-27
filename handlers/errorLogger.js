// handlers/errorLogger.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log file paths
const errorLogPath = path.join(logsDir, 'error.log');
const warningLogPath = path.join(logsDir, 'warning.log');

/**
 * Formats a date for logging
 * @returns {string} Formatted date
 */
function getFormattedDate() {
  const date = new Date();
  return `[${date.toISOString()}]`;
}

/**
 * Logs an error to file, console, and Supabase
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {Object} additional - Additional information
 */
function logError(message, error, additional = {}) {
  const timestamp = getFormattedDate();
  const errorStack = error ? error.stack || error.message || String(error) : 'No error details';
  
  // Format the log entry
  const logEntry = `${timestamp} ERROR: ${message}\n${errorStack}\nAdditional Info: ${JSON.stringify(additional)}\n\n`;
  
  // Log to console
  console.error(`❌ ${message}`, error);
  
  // Append to log file
  fs.appendFile(errorLogPath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to error log file:', err);
    }
  });
  
  // Also log to Supabase if client is available globally
  if (global.supabase) {
    try {
      global.supabase
        .from('system_logs')
        .insert([{
          action: 'error',
          discord_id: additional.userId || 'system',
          details: {
            message,
            error: errorStack,
            ...additional
          },
          created_at: new Date().toISOString()
        }])
        .then(() => {})
        .catch(err => console.error('Failed to log error to Supabase:', err));
    } catch (err) {
      console.error('Error logging to Supabase:', err);
    }
  }
}

/**
 * Logs a warning to file and console
 * @param {string} message - Warning message
 * @param {Object} additional - Additional information
 */
function logWarning(message, additional = {}) {
  const timestamp = getFormattedDate();
  
  // Format the log entry
  const logEntry = `${timestamp} WARNING: ${message}\nAdditional Info: ${JSON.stringify(additional)}\n\n`;
  
  // Log to console
  console.warn(`⚠️ ${message}`);
  
  // Append to log file
  fs.appendFile(warningLogPath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to warning log file:', err);
    }
  });
  
  // Also log to Supabase if client is available globally
  if (global.supabase) {
    try {
      global.supabase
        .from('system_logs')
        .insert([{
          action: 'warning',
          discord_id: additional.userId || 'system',
          details: {
            message,
            ...additional
          },
          created_at: new Date().toISOString()
        }])
        .then(() => {})
        .catch(err => console.error('Failed to log warning to Supabase:', err));
    } catch (err) {
      console.error('Error logging warning to Supabase:', err);
    }
  }
}

/**
 * Logs an error to a Discord channel
 * @param {Object} client - Discord client
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {Object} additional - Additional information
 */
async function logErrorToChannel(client, message, error, additional = {}) {
  // Only attempt if client is ready
  if (!client || !client.isReady()) return;
  
  // Find log channel
  const logChannelName = config.logChannel || 'kryptonite-logs';
  const channels = client.channels.cache.filter(c => c.name === logChannelName);
  
  if (channels.size === 0) return;
  const logChannel = channels.first();
  
  // Create error embed
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('❌ Bot Error')
    .setDescription(`**Error:** ${message}`)
    .addFields([
      { name: 'Error Details', value: `\`\`\`${error ? error.message || String(error) : 'No details'}\`\`\`` }
    ])
    .setTimestamp()
    .setFooter({ text: 'Krypton Bot Error Logger' });
  
  // Add additional info if provided
  if (Object.keys(additional).length > 0) {
    const additionalInfo = Object.entries(additional)
      .map(([key, value]) => `**${key}:** ${value}`)
      .join('\n');
    
    embed.addFields([{ name: 'Additional Information', value: additionalInfo }]);
  }
  
  // Send to log channel
  try {
    await logChannel.send({ embeds: [embed] });
    
    // Also log to Supabase if available
    if (client.db) {
      await client.db.logAction('discord_error', additional.userId || 'system', {
        message,
        error: error ? error.message || String(error) : 'No details',
        ...additional
      });
    }
  } catch (err) {
    console.error('Failed to send error log to Discord channel:', err);
  }
}

module.exports = {
  error: logError,
  warning: logWarning,
  logToChannel: logErrorToChannel
};