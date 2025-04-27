const cooldowns = new Map();
const embedBuilder = require('./embedBuilder');

module.exports = {
  /**
   * Checks if a command is on cooldown for a user
   * @param {Object} message - Discord message object
   * @param {Object} command - Command object
   * @returns {boolean} - True if command is on cooldown and should be blocked
   */
  check: (message, command) => {
    // No cooldown check needed if no cooldown specified
    if (!command.cooldown) return false;
    
    const userId = message.author.id;
    const commandName = command.name;
    const cooldownKey = `${userId}-${commandName}`;
    
    // Get cooldown amount in seconds
    const cooldownAmount = (command.cooldown || 3) * 1000;
    
    // Check if user has cooldown for this command
    if (cooldowns.has(cooldownKey)) {
      const expirationTime = cooldowns.get(cooldownKey);
      const now = Date.now();
      
      // If cooldown hasn't expired
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        
        // Notify user about cooldown
        const embed = embedBuilder.createEmbed(
          'Command Cooldown',
          `Please wait ${timeLeft.toFixed(1)} more second${timeLeft.toFixed(1) !== '1.0' ? 's' : ''} before using \`!${commandName}\` again.`,
          message.client
        );
        
        message.reply({ embeds: [embed] })
          .then(reply => {
            // Delete the cooldown message after the cooldown expires
            setTimeout(() => {
              reply.delete().catch(() => {});
            }, Math.min(timeLeft * 1000, 10000));
          })
          .catch(() => {});
        
        return true; // Command is on cooldown
      }
    }
    
    // Set cooldown
    cooldowns.set(cooldownKey, Date.now() + cooldownAmount);
    
    // Delete cooldown entry when it expires
    setTimeout(() => {
      cooldowns.delete(cooldownKey);
    }, cooldownAmount);
    
    return false; // Command is not on cooldown
  }
};