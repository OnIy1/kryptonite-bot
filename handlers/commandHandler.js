// handlers/commandHandler.js
const fs = require('fs');
const path = require('path');

module.exports = {
  init: (client) => {
    // Load regular commands
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.js'));
    
    console.log('Loading commands...');
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      client.commands.set(command.name, command);
    }
    
    // Load admin commands
    const adminCommandsPath = path.join(commandsPath, 'admin');
    if (fs.existsSync(adminCommandsPath)) {
      const adminCommandFiles = fs.readdirSync(adminCommandsPath)
        .filter(file => file.endsWith('.js'));
      
      for (const file of adminCommandFiles) {
        const command = require(path.join(adminCommandsPath, file));
        client.adminCommands.set(command.name, command);
      }
    }
    
    console.log(`✅ Loaded ${client.commands.size} regular commands and ${client.adminCommands.size} admin commands.`);
    
    // Initialize the system settings
    initializeSystemSettings(client);
  }
};

// Initialize necessary system settings in Supabase
async function initializeSystemSettings(client) {
  try {
    // Check if boost system setting exists
    const { data: boostSystem } = await client.supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'boost_system')
      .single();
    
    if (!boostSystem) {
      // Create default boost system settings
      await client.supabase
        .from('system_settings')
        .insert([{
          key: 'boost_system',
          value: {
            active: false,
            multiplier: 1,
            endTime: null
          }
        }]);
        
      console.log('✅ Created default boost system settings');
    } else {
      // Update client.boostSystem with current values
      client.boostSystem = boostSystem.value;
      
      // Check if boost has expired
      if (client.boostSystem.active && client.boostSystem.endTime && new Date(client.boostSystem.endTime) < new Date()) {
        // Reset boost system
        client.boostSystem = {
          active: false,
          multiplier: 1,
          endTime: null
        };
        
        // Update in database
        await client.supabase
          .from('system_settings')
          .update({ 
            value: client.boostSystem,
            updated_at: new Date().toISOString()
          })
          .eq('key', 'boost_system');
          
        console.log('⚠️ Expired boost system reset');
      } else {
        console.log('✅ Loaded boost system settings');
      }
    }
    
    // Initialize other settings like shop prices
    const { data: shopPrices } = await client.supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'shop_prices')
      .single();
      
    if (!shopPrices) {
      await client.supabase
        .from('system_settings')
        .insert([{
          key: 'shop_prices',
          value: {
            key_price: 10,
            role_price: 5
          }
        }]);
        
      console.log('✅ Created default shop prices');
    }
    
    // Initialize message cooldown
    const { data: messageCooldown } = await client.supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'message_cooldown')
      .single();
      
    if (!messageCooldown) {
      await client.supabase
        .from('system_settings')
        .insert([{
          key: 'message_cooldown',
          value: {
            seconds: config.messageRewardCooldown || 60
          }
        }]);
        
      console.log('✅ Created default message cooldown settings');
    }
    
    // Initialize daily reward
    const { data: dailyReward } = await client.supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'daily_reward')
      .single();
      
    if (!dailyReward) {
      await client.supabase
        .from('system_settings')
        .insert([{
          key: 'daily_reward',
          value: {
            coins: config.dailyReward || 50
          }
        }]);
        
      console.log('✅ Created default daily reward settings');
    }
  } catch (error) {
    console.error('❌ Error initializing system settings:', error);
  }
}