// Main bot file with Supabase integration
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load configuration
const config = require('./config.json');

// Initialize client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Create collections for commands
client.commands = new Collection();
client.adminCommands = new Collection();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Attach Supabase to client and global for easy access
client.supabase = supabase;
client.db = require('./supabase').db;

// Initialize data directories if they don't exist
const dataPath = path.join(__dirname, 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

const logsPath = path.join(__dirname, 'logs');
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath);
}

// Initialize boost system
client.boostSystem = {
  active: false,
  multiplier: 1,
  endTime: null
};

// Load handlers
const commandHandler = require('./handlers/commandHandler');
const messageHandler = require('./handlers/messageHandler');
const cooldownHandler = require('./handlers/cooldownHandler');
const databaseInit = require('./handlers/databaseInit');
const logger = require('./handlers/errorLogger');

// Initialize handlers
async function initializeBot() {
  // First initialize database connection
  const dbInitialized = await databaseInit(client);
  
  if (!dbInitialized) {
    console.error('❌ Failed to initialize database connection. Check your Supabase settings.');
    process.exit(1);
  }
  
  // Then load commands
  commandHandler.init(client);
  messageHandler.init(client);
  
  console.log('✅ Bot initialization completed!');
}

// Login event
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} is online!`);
  
  // Set custom status with rotation
  const statusMessages = [
    { type: 'WATCHING', message: 'users earn coins 💰' },
    { type: 'LISTENING', message: `${config.prefix}help | Krypton Executor` },
    { type: 'PLAYING', message: 'with your economy 💸' }
  ];
  
  let statusIndex = 0;
  
  // Set initial status
  updateStatus(statusIndex);
  
  // Rotate status every 30 minutes
  setInterval(() => {
    statusIndex = (statusIndex + 1) % statusMessages.length;
    updateStatus(statusIndex);
  }, 30 * 60 * 1000); // 30 minutes
  
  function updateStatus(index) {
    const { type, message } = statusMessages[index];
    client.user.setActivity(message, { type: type });
  }
});

// Handle messages
client.on('messageCreate', async message => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Ensure user exists in database
  if (client.db) {
    await client.db.ensureUser(
      message.author.id,
      message.author.username,
      message.author.displayAvatarURL()
    );
  }
  
  // Handle commands
  if (message.content.startsWith(config.prefix)) {
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Check for admin commands first
    if (client.adminCommands.has(commandName)) {
      const command = client.adminCommands.get(commandName);
      
      // Check command permission level
      const isOwnerOnly = command.ownerOnly === true;
      const isOwner = message.author.id === config.ownerId;
      
      // Check trust status from Supabase
      let isTrusted = false;
      
      if (client.db) {
        isTrusted = await client.db.isTrusted(message.author.id);
      }
      
      // Permission check
      let authorized = false;
      
      if (isOwnerOnly) {
        // Owner-only commands can only be used by the bot owner
        authorized = isOwner;
      } else {
        // Regular admin commands can be used by owner or trusted users
        authorized = isOwner || isTrusted;
      }
      
      if (authorized) {
        // Check if command is on cooldown
        if (cooldownHandler.check(message, command)) {
          return; // Skip execution if on cooldown
        }
        
        try {
          await command.execute(client, message, args);
        } catch (error) {
          logger.error(`Error executing admin command ${commandName}`, error, {
            user: message.author.tag,
            userId: message.author.id,
            isOwner: message.author.id === config.ownerId,
            command: commandName,
            args: args.join(' ')
          });
          
          // Log the error to Supabase
          if (client.db) {
            await client.db.logAction('error', message.author.id, {
              command: commandName,
              args: args.join(' '),
              error: error.message
            });
          }
          
          message.reply('There was an error executing that command.');
        }
      } else {
        let errorMessage = '❌ You are not authorized to use this command.';
        if (isOwnerOnly && isTrusted) {
          errorMessage = '❌ This command can only be used by the bot owner.';
        }
        
        message.reply(errorMessage);
        console.log(`❌ Unauthorized attempt to use admin command by ${message.author.tag}`);
        
        // Log the unauthorized attempt to Supabase
        if (client.db) {
          await client.db.logAction('unauthorized_command', message.author.id, {
            command: commandName,
            args: args.join(' ')
          });
        }
      }
      return;
    }
    
    // Handle regular commands
    if (client.commands.has(commandName)) {
      const command = client.commands.get(commandName);
      
      // Check if command is on cooldown
      if (cooldownHandler.check(message, command)) {
        return; // Skip execution if on cooldown
      }
      
      try {
        await command.execute(client, message, args);
      } catch (error) {
        logger.error(`Error executing command ${commandName}`, error, {
          user: message.author.tag,
          userId: message.author.id,
          command: commandName,
          args: args.join(' ')
        });
        
        // Log the error to Supabase
        if (client.db) {
          await client.db.logAction('error', message.author.id, {
            command: commandName,
            args: args.join(' '),
            error: error.message
          });
        }
        
        message.reply('There was an error executing that command.');
      }
    }
  }
  
  // Process message for coins
  messageHandler.processMessage(client, message);
});

// Error handling
client.on('error', async error => {
  logger.error('Discord client error', error, { source: 'Discord.js Client' });
  logger.logToChannel(client, 'Discord client error', error);
  
  // Also log to Supabase
  if (client.db) {
    await client.db.logAction('client_error', 'system', {
      error: error.message,
      stack: error.stack
    });
  }
});

client.on('shardError', async (error, shardId) => {
  logger.error('Discord shard error', error, { shardId });
  logger.logToChannel(client, 'Discord shard error', error, { shardId });
  
  // Also log to Supabase
  if (client.db) {
    await client.db.logAction('shard_error', 'system', {
      error: error.message,
      stack: error.stack,
      shardId
    });
  }
});

process.on('unhandledRejection', async (error, promise) => {
  logger.error('Unhandled promise rejection', error, { 
    promise: promise ? promise.toString() : 'Unknown Promise'
  });
  logger.logToChannel(client, 'Unhandled promise rejection', error);
  
  // Also log to Supabase
  if (client.db) {
    await client.db.logAction('unhandled_rejection', 'system', {
      error: error.message,
      stack: error.stack
    });
  }
});

process.on('uncaughtException', async (error) => {
  logger.error('Uncaught exception', error);
  logger.logToChannel(client, 'Critical: Uncaught exception', error);
  
  // Also log to Supabase
  if (client.db && client.db.logAction) {
    try {
      await client.db.logAction('uncaught_exception', 'system', {
        error: error.message,
        stack: error.stack
      });
    } catch (logError) {
      console.error('Failed to log exception to Supabase:', logError);
    }
  }
  
  // Give time for logs to be written then exit
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

// Initialize bot and login to Discord
initializeBot()
  .then(() => {
    // Login to Discord with token from env 
    client.login(process.env.TOKEN);
  })
  .catch(error => {
    console.error('❌ Fatal error during bot initialization:', error);
    process.exit(1);
  });
