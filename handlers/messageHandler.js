// handlers/messageHandler.js
const config = require('../config.json');

// User cooldowns for message rewards
const messageCooldowns = new Map();

module.exports = {
  init(client) {
    // Nothing to initialize
    console.log('✅ Message handler initialized!');
  },
  
  async processMessage(client, message) {
    // Skip if it's a bot or a command
    if (message.author.bot || message.content.startsWith(config.prefix)) {
      return;
    }
    
    const userId = message.author.id;
    
    // Get the cooldown for this user
    const userCooldown = messageCooldowns.get(userId) || 0;
    const now = Date.now();
    
    // Check if the user is on cooldown
    if (now - userCooldown < config.messageRewardCooldown * 1000) {
      return;
    }
    
    // Set new cooldown
    messageCooldowns.set(userId, now);
    
    // Calculate coins to award
    let coinsToAward = config.messageReward || 1;
    
    // Check if boost is active
    if (client.boostSystem.active && client.boostSystem.endTime > now) {
      coinsToAward *= client.boostSystem.multiplier;
    }
    
    // Award coins using Supabase
    try {
      // Ensure user exists in database
      await client.db.ensureUser(
        userId,
        message.author.username,
        message.author.displayAvatarURL()
      );
      
      // Add coins
      const { data, error } = await client.db.updateCoins(userId, coinsToAward);
      
      if (error) {
        console.error('Error awarding coins:', error);
        return;
      }
      
      // Log to database
      await client.db.logAction('message_reward', userId, {
        coins: coinsToAward,
        channel: message.channel.id,
        guild: message.guild?.id
      });
      
      // Increment message count
      await this.incrementMessageCount(client, userId);
      
      // Optional: Secretly DM the user every X messages about their earnings
      // This is commented out to avoid spamming users
      /*
      const { data: user } = await client.db.getUser(userId);
      if (user.messages_count % 100 === 0) {
        message.author.send(
          `🎉 Congratulations! You've sent ${user.messages_count} messages and earned ${user.coins} coins in total!`
        ).catch(() => {}); // Ignore errors if DMs are closed
      }
      */
    } catch (error) {
      console.error('Error processing message reward:', error);
    }
  },
  
  async incrementMessageCount(client, userId) {
    try {
      // First get current user data
      const { data: user } = await client.db.getUser(userId);
      if (!user) return 0;
      
      const messageCount = (user.messages_count || 0) + 1;
      
      // Update the message count
      await client.supabase
        .from('users')
        .update({ messages_count: messageCount })
        .eq('discord_id', userId);
        
      return messageCount;
    } catch (error) {
      console.error('Error incrementing message count:', error);
      return 0;
    }
  }
};