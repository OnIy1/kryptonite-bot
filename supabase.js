// supabase.js - Database integration for the Discord bot
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Database operations
const db = {
  // User management
  async getUser(discordId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('discord_id', discordId)
        .single();
        
      return { data, error };
    } catch (err) {
      console.error('Error in getUser:', err);
      return { data: null, error: err };
    }
  },
  
  async createUser(discordId, username, avatarUrl = null) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          discord_id: discordId,
          username: username,
          avatar_url: avatarUrl,
          coins: 0,
          joined_at: new Date().toISOString(),
          is_banned: false,
          key: null,
          last_daily: null
        }])
        .select()
        .single();
        
      return { data, error };
    } catch (err) {
      console.error('Error in createUser:', err);
      return { data: null, error: err };
    }
  },
  
  async ensureUser(discordId, username, avatarUrl = null) {
    try {
      const { data: existingUser, error: getUserError } = await this.getUser(discordId);
      
      if (getUserError || !existingUser) {
        return await this.createUser(discordId, username, avatarUrl);
      }
      
      return { data: existingUser, error: null };
    } catch (err) {
      console.error('Error in ensureUser:', err);
      return { data: null, error: err };
    }
  },
  
  // Coins management
  async getCoins(discordId) {
    try {
      const { data, error } = await this.getUser(discordId);
      if (error) {
        console.error('Error getting coins:', error);
        return { coins: 0, error };
      }
      return { coins: data?.coins || 0, error: null };
    } catch (err) {
      console.error('Error in getCoins:', err);
      return { coins: 0, error: err };
    }
  },
  
  async updateCoins(discordId, amount) {
    try {
      // First ensure the user exists
      await this.ensureUser(discordId);
      
      // Then get current coins
      const { data: user } = await this.getUser(discordId);
      if (!user) return { error: 'User not found' };
      
      const newBalance = user.coins + amount;
      
      const { data, error } = await supabase
        .from('users')
        .update({ coins: newBalance })
        .eq('discord_id', discordId)
        .select();
        
      return { data, error, newBalance };
    } catch (err) {
      console.error('Error in updateCoins:', err);
      return { error: err };
    }
  },
  
  async setCoins(discordId, amount) {
    try {
      // First ensure the user exists
      await this.ensureUser(discordId);
      
      const { data, error } = await supabase
        .from('users')
        .update({ coins: amount })
        .eq('discord_id', discordId)
        .select();
        
      return { data, error };
    } catch (err) {
      console.error('Error in setCoins:', err);
      return { error: err };
    }
  },

  // Trust system related functions
  async isTrusted(userId) {
    try {
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
    } catch (err) {
      console.error('Error in isTrusted:', err);
      return false;
    }
  },
  
  // Key management
  async generateKey(discordId) {
    try {
      // First ensure the user exists
      await this.ensureUser(discordId);
      
      // Generate a unique key
      const key = `KRYPTON-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('users')
        .update({ key: key })
        .eq('discord_id', discordId)
        .select();
        
      return { data, error, key };
    } catch (err) {
      console.error('Error in generateKey:', err);
      return { error: err };
    }
  },
  
  async validateKey(key) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('key', key)
        .single();
        
      if (error || !data) return { valid: false };
      if (data.is_banned) return { valid: false, reason: 'banned' };
      
      return { valid: true, user: data };
    } catch (err) {
      console.error('Error in validateKey:', err);
      return { valid: false, error: err };
    }
  },
  
  // Daily rewards
  async claimDaily(discordId) {
    try {
      // First ensure the user exists
      await this.ensureUser(discordId);
      
      const { data: user } = await this.getUser(discordId);
      if (!user) return { error: 'User not found' };
      
      const now = new Date();
      const lastDaily = user.last_daily ? new Date(user.last_daily) : null;
      
      // Check if 24 hours have passed
      if (lastDaily && (now - lastDaily) < 24 * 60 * 60 * 1000) {
        const remainingTime = 24 * 60 * 60 * 1000 - (now - lastDaily);
        const hours = Math.floor(remainingTime / (60 * 60 * 1000));
        const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        
        return { 
          success: false, 
          cooldown: true, 
          remainingTime: `${hours}h ${minutes}m` 
        };
      }
      
      // Award coins and update last daily
      const coinsToAdd = 50; // Can be adjusted
      
      const { data, error, newBalance } = await this.updateCoins(discordId, coinsToAdd);
      if (error) return { error };
      
      await supabase
        .from('users')
        .update({ last_daily: now.toISOString() })
        .eq('discord_id', discordId);
        
      return { 
        success: true, 
        coins: coinsToAdd, 
        newBalance: newBalance || user.coins + coinsToAdd 
      };
    } catch (err) {
      console.error('Error in claimDaily:', err);
      return { error: err };
    }
  },
  
  // Admin functions
  async banUser(discordId, reason = null) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          is_banned: true,
          ban_reason: reason
        })
        .eq('discord_id', discordId)
        .select();
        
      // Log the ban
      await this.logAction('ban', discordId, { reason });
        
      return { data, error };
    } catch (err) {
      console.error('Error in banUser:', err);
      return { error: err };
    }
  },
  
  async unbanUser(discordId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          is_banned: false,
          ban_reason: null
        })
        .eq('discord_id', discordId)
        .select();
        
      // Log the unban
      await this.logAction('unban', discordId);
        
      return { data, error };
    } catch (err) {
      console.error('Error in unbanUser:', err);
      return { error: err };
    }
  },
  
  // System logs
  async logAction(action, discordId, details = {}) {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert([{
          action,
          discord_id: discordId,
          details,
          created_at: new Date().toISOString()
        }]);
        
      return { error };
    } catch (err) {
      console.error('Error in logAction:', err);
      return { error: err };
    }
  },
  
  // Stats
  async getStats() {
    try {
      // Get total users
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        
      // Get total coins in circulation
      const { data: coinsData, error: coinsError } = await supabase
        .from('users')
        .select('coins')
        .gt('coins', 0);
        
      const totalCoins = coinsData ? coinsData.reduce((sum, user) => sum + user.coins, 0) : 0;
      
      // Get active users (users who used the bot in the last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeUsers, error: activeError } = await supabase
        .from('system_logs')
        .select('discord_id', { count: 'exact', head: true, distinct: true })
        .gt('created_at', sevenDaysAgo.toISOString());
        
      return {
        total_users: userCount || 0,
        total_coins: totalCoins,
        active_users: activeUsers || 0,
        errors: [userError, coinsError, activeError].filter(Boolean)
      };
    } catch (err) {
      console.error('Error in getStats:', err);
      return {
        total_users: 0,
        total_coins: 0,
        active_users: 0,
        errors: [err]
      };
    }
  },
  
  async getLeaderboard(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('coins', { ascending: false })
        .limit(limit);
        
      return { data, error };
    } catch (err) {
      console.error('Error in getLeaderboard:', err);
      return { data: [], error: err };
    }
  },
  
  async getRecentLogs(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select(`
          *,
          users:discord_id (username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      return { data, error };
    } catch (err) {
      console.error('Error in getRecentLogs:', err);
      return { data: [], error: err };
    }
  }
};

module.exports = { supabase, db };
