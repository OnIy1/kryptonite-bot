// migrate-data.js - Migrates local JSON data to Supabase
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Paths to data files
const dataPath = path.join(__dirname, 'data');
const coinsPath = path.join(dataPath, 'coins.json');
const trustPath = path.join(dataPath, 'trust.json');
const lastDailyPath = path.join(dataPath, 'lastDaily.json');

// Migration counter
let migratedUsers = 0;
let migratedTrusted = 0;

// Fetch User from Discord API (if possible)
async function fetchDiscordUser(userId) {
  if (!process.env.TOKEN) {
    return null;
  }
  
  try {
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        'Authorization': `Bot ${process.env.TOKEN}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error(`Error fetching user ${userId} from Discord API:`, error);
  }
  
  return null;
}

// Migrate coins data
async function migrateCoins() {
  console.log('\n--- MIGRATING COINS DATA ---');
  
  if (!fs.existsSync(coinsPath)) {
    console.log('No coins.json file found, skipping coins migration.');
    return;
  }
  
  try {
    const coinsData = JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
    const lastDailyData = fs.existsSync(lastDailyPath) 
      ? JSON.parse(fs.readFileSync(lastDailyPath, 'utf8')) 
      : {};
    
    console.log(`Found ${Object.keys(coinsData).length} users with coins...`);
    
    for (const [userId, coins] of Object.entries(coinsData)) {
      try {
        // Try to get Discord username if possible
        let username = 'Unknown User';
        let avatarUrl = null;
        
        const userInfo = await fetchDiscordUser(userId);
        if (userInfo) {
          username = userInfo.username;
          if (userInfo.avatar) {
            avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userInfo.avatar}.png`;
          }
        }
        
        // Get last daily claim timestamp if exists
        const lastDaily = lastDailyData[userId] 
          ? new Date(lastDailyData[userId]).toISOString() 
          : null;
        
        // Insert or update user in Supabase
        const { data, error } = await supabase
          .from('users')
          .upsert([{
            discord_id: userId,
            username: username,
            avatar_url: avatarUrl,
            coins: coins,
            joined_at: new Date().toISOString(),
            last_daily: lastDaily
          }], {
            onConflict: 'discord_id'
          });
        
        if (error) {
          console.error(`Error migrating user ${userId}:`, error);
        } else {
          migratedUsers++;
          process.stdout.write(`\rMigrated ${migratedUsers} users...`);
        }
      } catch (error) {
        console.error(`\nError processing user ${userId}:`, error);
      }
    }
    
    console.log(`\n✅ Successfully migrated ${migratedUsers} users with coins.`);
  } catch (error) {
    console.error('Error migrating coins data:', error);
  }
}

// Migrate trusted users
async function migrateTrusted() {
  console.log('\n--- MIGRATING TRUSTED USERS ---');
  
  if (!fs.existsSync(trustPath)) {
    console.log('No trust.json file found, skipping trusted users migration.');
    return;
  }
  
  try {
    const trustData = JSON.parse(fs.readFileSync(trustPath, 'utf8'));
    const trustedUserIds = Object.keys(trustData).filter(id => trustData[id] === true);
    
    console.log(`Found ${trustedUserIds.length} trusted users...`);
    
    for (const userId of trustedUserIds) {
      try {
        // Try to get Discord username if possible
        let username = 'Unknown User';
        
        const userInfo = await fetchDiscordUser(userId);
        if (userInfo) {
          username = userInfo.username;
        }
        
        // Insert trusted user in Supabase
        const { data, error } = await supabase
          .from('trusted_users')
          .upsert([{
            discord_id: userId,
            username: username,
            added_at: new Date().toISOString(),
            added_by: process.env.OWNER_ID || 'system'
          }], {
            onConflict: 'discord_id'
          });
        
        if (error) {
          console.error(`Error migrating trusted user ${userId}:`, error);
        } else {
          migratedTrusted++;
          process.stdout.write(`\rMigrated ${migratedTrusted} trusted users...`);
        }
      } catch (error) {
        console.error(`\nError processing trusted user ${userId}:`, error);
      }
    }
    
    console.log(`\n✅ Successfully migrated ${migratedTrusted} trusted users.`);
  } catch (error) {
    console.error('Error migrating trusted users:', error);
  }
}

// Create initial system settings
async function createSystemSettings() {
  console.log('\n--- CREATING SYSTEM SETTINGS ---');
  
  try {
    // Default settings
    const settings = [
      {
        key: 'boost_system',
        value: {
          active: false,
          multiplier: 1,
          endTime: null
        }
      },
      {
        key: 'message_cooldown',
        value: {
          seconds: 60
        }
      },
      {
        key: 'daily_reward',
        value: {
          coins: 50
        }
      },
      {
        key: 'shop_prices',
        value: {
          key_price: 10,
          role_price: 5
        }
      }
    ];
    
    for (const setting of settings) {
      // Check if setting already exists
      const { data: existingSetting } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', setting.key)
        .single();
      
      if (!existingSetting) {
        // Insert setting
        const { error } = await supabase
          .from('system_settings')
          .insert([{
            key: setting.key,
            value: setting.value,
            updated_at: new Date().toISOString()
          }]);
        
        if (error) {
          console.error(`Error creating system setting "${setting.key}":`, error);
        } else {
          console.log(`✅ Created system setting: ${setting.key}`);
        }
      } else {
        console.log(`⚠️ System setting "${setting.key}" already exists, skipping.`);
      }
    }
    
    console.log('✅ System settings initialized.');
  } catch (error) {
    console.error('Error creating system settings:', error);
  }
}

// Create a log entry for migration
async function logMigration() {
  try {
    const { error } = await supabase
      .from('system_logs')
      .insert([{
        action: 'data_migration',
        discord_id: process.env.OWNER_ID || 'system',
        details: {
          users_migrated: migratedUsers,
          trusted_users_migrated: migratedTrusted,
          migration_date: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error logging migration:', error);
    } else {
      console.log('✅ Migration logged to system logs.');
    }
  } catch (error) {
    console.error('Error logging migration:', error);
  }
}

// Main migration function
async function migrateAll() {
  console.log('=== KRYPTON BOT DATA MIGRATION ===');
  console.log('Starting migration from JSON files to Supabase...');
  
  try {
    // Test Supabase connection
    const { error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return;
    }
    
    console.log('✅ Connected to Supabase successfully.');
    
    // Run migrations
    await migrateCoins();
    await migrateTrusted();
    await createSystemSettings();
    await logMigration();
    
    console.log('\n=== MIGRATION COMPLETED ===');
    console.log(`✅ Users migrated: ${migratedUsers}`);
    console.log(`✅ Trusted users migrated: ${migratedTrusted}`);
    console.log('✅ System settings initialized');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateAll().catch(console.error);