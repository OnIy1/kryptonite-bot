// handlers/databaseInit.js
const config = require('../config.json');

module.exports = async (client) => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test the connection
    const { data, error } = await client.supabase.from('users').select('*').limit(1);
    
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    console.log('✅ Connected to Supabase successfully.');
    
    // Initialize boost system
    await initializeBoostSystem(client);
    
    // Initialize system settings
    await initializeSystemSettings(client);
    
    // Make supabase globally available for logging
    global.supabase = client.supabase;
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return false;
  }
};

async function initializeBoostSystem(client) {
  try {
    // Get boost system settings
    const { data, error } = await client.supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'boost_system')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // If error is not "not found"
      console.error('Error fetching boost system:', error);
      return;
    }
    
    if (!data) {
      // Create default boost system settings
      const defaultBoostSystem = {
        active: false,
        multiplier: 1,
        endTime: null
      };
      
      await client.supabase
        .from('system_settings')
        .insert([{
          key: 'boost_system',
          value: defaultBoostSystem
        }]);
      
      client.boostSystem = defaultBoostSystem;
      console.log('✅ Created default boost system settings');
    } else {
      // Check if boost has expired
      if (data.value.active && data.value.endTime && new Date(data.value.endTime) < new Date()) {
        // Reset boost system
        const resetBoost = {
          active: false,
          multiplier: 1,
          endTime: null
        };
        
        await client.supabase
          .from('system_settings')
          .update({ value: resetBoost })
          .eq('key', 'boost_system');
          
        client.boostSystem = resetBoost;
        console.log('⚠️ Expired boost reset to default');
      } else {
        client.boostSystem = data.value;
        console.log('✅ Loaded boost system settings');
        
        if (client.boostSystem.active) {
          console.log(`🚀 Active boost: ${client.boostSystem.multiplier}x multiplier until ${new Date(client.boostSystem.endTime).toLocaleString()}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error initializing boost system:', error);
    
    // Set default boost system
    client.boostSystem = {
      active: false,
      multiplier: 1,
      endTime: null
    };
  }
}

async function initializeSystemSettings(client) {
  try {
    // Define default settings
    const defaultSettings = [
      {
        key: 'message_cooldown',
        value: { seconds: config.messageRewardCooldown || 60 }
      },
      {
        key: 'daily_reward',
        value: { coins: config.dailyReward || 50 }
      },
      {
        key: 'shop_prices',
        value: {
          key_price: 10,
          role_price: 5
        }
      }
    ];
    
    // Check and create each setting if it doesn't exist
    for (const setting of defaultSettings) {
      const { data, error } = await client.supabase
        .from('system_settings')
        .select('*')
        .eq('key', setting.key)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error(`Error fetching ${setting.key}:`, error);
        continue;
      }
      
      if (!data) {
        await client.supabase
          .from('system_settings')
          .insert([setting]);
          
        console.log(`✅ Created default ${setting.key} settings`);
      }
    }
    
    console.log('✅ System settings initialized');
  } catch (error) {
    console.error('❌ Error initializing system settings:', error);
  }
}