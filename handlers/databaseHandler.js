// handlers/databaseHandler.js
const { createClient } = require('@supabase/supabase-js');
const config = require('../config.json');

// Initialize Supabase client with your project URL and anon key
const supabase = createClient(
  config.supabaseUrl,
  config.supabaseKey
);

module.exports = {
  // Users related functions
  async getUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error);
      return null;
    }
    
    return data;
  },
  
  async createUser(userId, username) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          discord_id: userId, 
          username: username,
          coins: 0,
          messages_count: 0,
          last_daily: null,
          joined_at: new Date()
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating user:', error);
      return null;
    }
    
    return data[0];
  },
  
  async getOrCreateUser(userId, username) {
    let user = await this.getUser(userId);
    
    if (!user) {
      user = await this.createUser(userId, username);
    }
    
    return user;
  },
  
  // Coins related functions
  async getCoins(userId) {
    const user = await this.getUser(userId);
    return user ? user.coins : 0;
  },
  
  async addCoins(userId, username, amount) {
    const user = await this.getOrCreateUser(userId, username);
    
    const { data, error } = await supabase
      .from('users')
      .update({ coins: user.coins + amount })
      .eq('discord_id', userId)
      .select();
    
    if (error) {
      console.error('Error adding coins:', error);
      return false;
    }
    
    return true;
  },
  
  async setCoins(userId, username, amount) {
    await this.getOrCreateUser(userId, username);
    
    const { error } = await supabase
      .from('users')
      .update({ coins: amount })
      .eq('discord_id', userId);
    
    if (error) {
      console.error('Error setting coins:', error);
      return false;
    }
    
    return true;
  },
  
  // Trust system related functions
  async isTrusted(userId) {
    const { data, error } = await supabase
      .from('trusted_users')
      .select('*')
      .eq('discord_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking trust status:', error);
      return false;
    }
    
    return !!data;
  },
  
  async addTrustedUser(userId, username) {
    const { error } = await supabase
      .from('trusted_users')
      .insert([
        { 
          discord_id: userId, 
          username: username,
          added_at: new Date()
        }
      ]);
    
    if (error) {
      console.error('Error adding trusted user:', error);
      return false;
    }
    
    return true;
  },
  
  async removeTrustedUser(userId) {
    const { error } = await supabase
      .from('trusted_users')
      .delete()
      .eq('discord_id', userId);
    
    if (error) {
      console.error('Error removing trusted user:', error);
      return false;
    }
    
    return true;
  },
  
  // Daily reward related functions
  async claimDaily(userId, username, amount) {
    const user = await this.getOrCreateUser(userId, username);
    const now = new Date();
    
    const { error } = await supabase
      .from('users')
      .update({ 
        coins: user.coins + amount,
        last_daily: now.toISOString()
      })
      .eq('discord_id', userId);
    
    if (error) {
      console.error('Error claiming daily reward:', error);
      return false;
    }
    
    return true;
  },
  
  async canClaimDaily(userId) {
    const user = await this.getUser(userId);
    
    if (!user || !user.last_daily) {
      return true;
    }
    
    const lastDaily = new Date(user.last_daily);
    const now = new Date();
    const diffHours = (now - lastDaily) / (1000 * 60 * 60);
    
    return diffHours >= 24;
  },
  
  // Leaderboard related functions
  async getLeaderboard(limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('users')
      .select('discord_id, username, coins')
      .order('coins', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
    
    return data;
  },
  
  // Log actions to database
  async logAction(userId, username, action, details) {
    const { error } = await supabase
      .from('logs')
      .insert([
        { 
          discord_id: userId, 
          username: username,
          action: action,
          details: details,
          created_at: new Date()
        }
      ]);
    
    if (error) {
      console.error('Error logging action:', error);
      return false;
    }
    
    return true;
  }
};